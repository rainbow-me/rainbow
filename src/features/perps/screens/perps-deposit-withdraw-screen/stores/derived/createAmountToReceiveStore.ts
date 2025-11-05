import { PerpsDepositAmountStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositAmountStore';
import { PerpsDepositQuoteStoreType } from '@/features/perps/screens/perps-deposit-withdraw-screen/stores/createPerpsDepositQuoteStore';
import { QuoteStatus } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import { getNumberFormatter } from '@/helpers/intl';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { equalWorklet } from '@/safe-math/SafeMath';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { DerivedStore, InferStoreState } from '@/state/internal/types';
import { deepFreeze } from '@/utils/deepFreeze';
import { shallowEqual } from '@/worklets/comparisons';

export type PerpsAmountToReceiveStore = DerivedStore<FormattedQuoteResult>;

type QuoteResult = QuoteStatus.Error | QuoteStatus.InsufficientBalance | QuoteStatus.Pending | string | null;
type FormattedQuoteResult =
  | {
      formattedAmount: null;
      status: QuoteStatus.Pending | QuoteStatus.Error | QuoteStatus.InsufficientBalance | QuoteStatus.ZeroAmountError;
    }
  | {
      status: QuoteStatus.Success;
      formattedAmount: string;
    };

const ERRORS = deepFreeze({
  [QuoteStatus.Error]: { formattedAmount: null, status: QuoteStatus.Error },
  [QuoteStatus.InsufficientBalance]: { formattedAmount: null, status: QuoteStatus.InsufficientBalance },
  [QuoteStatus.ZeroAmountError]: { formattedAmount: null, status: QuoteStatus.ZeroAmountError },
  [QuoteStatus.Pending]: { formattedAmount: null, status: QuoteStatus.Pending },
});

export function createAmountToReceiveStore(
  useAmountStore: PerpsDepositAmountStoreType,
  useQuoteStore: PerpsDepositQuoteStoreType
): PerpsAmountToReceiveStore {
  return createDerivedStore(
    $ => {
      const statusOrAmount = $(useQuoteStore, determineQuoteResult);
      const isAmountZero = $(useAmountStore, state => state.isZero());
      if (isAmountZero) return ERRORS[QuoteStatus.ZeroAmountError];

      switch (statusOrAmount) {
        case QuoteStatus.Error:
        case QuoteStatus.InsufficientBalance:
        case QuoteStatus.Pending:
          return ERRORS[statusOrAmount];
        case null:
          return ERRORS[QuoteStatus.Error];
        default:
          return {
            formattedAmount: `~${getNumberFormatter('en-US', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }).format(Number(statusOrAmount))} USDC`,
            status: QuoteStatus.Success,
          };
      }
    },

    { equalityFn: shallowEqual, fastMode: true }
  );
}

function determineQuoteResult(state: InferStoreState<PerpsDepositQuoteStoreType>): QuoteResult {
  const quote = state.getData();

  if (!quote) {
    const isError = state.getStatus('isError');
    if (isError) return QuoteStatus.Error;
    return QuoteStatus.Pending;
  }

  if (quote === QuoteStatus.InsufficientBalance)
    return state.getStatus('isSuccess') ? QuoteStatus.InsufficientBalance : QuoteStatus.Pending;

  const outputAsset = quote.buyTokenAsset;
  const buyAmountString = quote.buyAmount.toString();
  if (!outputAsset || equalWorklet(buyAmountString, '0')) return QuoteStatus.Error;

  const assetDecimals = outputAsset.networks[outputAsset.chainId]?.decimals ?? outputAsset.decimals ?? 18;
  return convertRawAmountToDecimalFormat(buyAmountString, assetDecimals);
}
