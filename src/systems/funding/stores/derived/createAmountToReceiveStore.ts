import { getNumberFormatter } from '@/helpers/intl';
import { convertRawAmountToDecimalFormat } from '@/helpers/utilities';
import { equalWorklet } from '@/framework/core/safeMath';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { InferStoreState } from '@/state/internal/types';
import { shallowEqual } from '@/worklets/comparisons';
import { AmountStoreType, DepositAmountToReceiveStore, DepositQuoteStatus, DepositQuoteStoreType, FormattedQuoteResult } from '../../types';

// ============ Types ========================================================== //

/**
 * Discriminated union for quote determination results.
 * Using `kind` field ensures exhaustive switch checking.
 */
type QuoteResult =
  | { kind: 'error' }
  | { kind: 'insufficientBalance' }
  | { kind: 'insufficientGas' }
  | { kind: 'pending' }
  | { kind: 'success'; amount: string; symbol: string };

// ============ Constants ====================================================== //

const ERROR_STATES: Record<'error' | 'insufficientBalance' | 'insufficientGas' | 'pending' | 'zeroAmount', FormattedQuoteResult> = {
  error: { formattedAmount: null, status: DepositQuoteStatus.Error },
  insufficientBalance: { formattedAmount: null, status: DepositQuoteStatus.InsufficientBalance },
  insufficientGas: { formattedAmount: null, status: DepositQuoteStatus.InsufficientGas },
  pending: { formattedAmount: null, status: DepositQuoteStatus.Pending },
  zeroAmount: { formattedAmount: null, status: DepositQuoteStatus.ZeroAmountError },
};

// ============ Store Factory ================================================== //

export function createAmountToReceiveStore(
  useAmountStore: AmountStoreType,
  useQuoteStore: DepositQuoteStoreType,
  displaySymbolOverride?: string
): DepositAmountToReceiveStore {
  return createDerivedStore<FormattedQuoteResult>(
    $ => {
      const result = $(useQuoteStore, determineQuoteResult);
      const isAmountZero = $(useAmountStore, state => state.isZero());
      if (isAmountZero) return ERROR_STATES.zeroAmount;

      switch (result.kind) {
        case 'error':
          return ERROR_STATES.error;
        case 'insufficientBalance':
          return ERROR_STATES.insufficientBalance;
        case 'insufficientGas':
          return ERROR_STATES.insufficientGas;
        case 'pending':
          return ERROR_STATES.pending;
        case 'success':
          return {
            formattedAmount: `~${getNumberFormatter('en-US', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }).format(Number(result.amount))} ${displaySymbolOverride ?? result.symbol}`,
            status: DepositQuoteStatus.Success,
          };
      }
    },
    { equalityFn: shallowEqual, fastMode: true }
  );
}

// ============ Quote Result Selector ========================================== //

function determineQuoteResult(state: InferStoreState<DepositQuoteStoreType>): QuoteResult {
  const quote = state.getData();

  if (!quote) {
    const isError = state.getStatus('isError');
    if (isError) return { kind: 'error' };
    return { kind: 'pending' };
  }

  if (quote === DepositQuoteStatus.InsufficientBalance) {
    return state.getStatus('isSuccess') ? { kind: 'insufficientBalance' } : { kind: 'pending' };
  }

  if (quote === DepositQuoteStatus.InsufficientGas) {
    return state.getStatus('isSuccess') ? { kind: 'insufficientGas' } : { kind: 'pending' };
  }

  const outputAsset = quote.buyTokenAsset;
  const buyAmountString = quote.buyAmount.toString();
  if (!outputAsset || equalWorklet(buyAmountString, '0')) return { kind: 'error' };

  const assetDecimals = outputAsset.networks[outputAsset.chainId]?.decimals ?? outputAsset.decimals ?? 18;
  const amount = convertRawAmountToDecimalFormat(buyAmountString, assetDecimals);
  const symbol = outputAsset.symbol ?? 'tokens';
  return { kind: 'success', amount, symbol };
}
