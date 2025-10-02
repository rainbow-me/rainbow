import { HYPERCORE_PSEUDO_CHAIN_ID, HYPERLIQUID_USDC_ADDRESS } from '@/features/perps/constants';
import { QuoteStatus } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { ensureError } from '@/logger';
import { CrosschainQuote, QuoteError, QuoteParams, getCrosschainQuote } from '@rainbow-me/swaps';
import { equalWorklet, greaterThanWorklet } from '@/safe-math/SafeMath';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChainId } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { QueryStore } from '@/state/internal/queryStore/types';
import { InferStoreState } from '@/state/internal/types';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { stripNonDecimalNumbers } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';
import { PerpsDepositAmountStoreType } from './createPerpsDepositAmountStore';
import { PerpsDepositStoreType } from './createPerpsDepositStore';

export type PerpsDepositQuoteStoreType = QueryStore<CrosschainQuote | QuoteStatus.InsufficientBalance, QuoteStoreParams>;

type QuoteStoreParams = {
  accountAddress: string;
  amount: string;
  asset: { address: string; balance: string; chainId: ChainId; decimals: number } | null;
};

export function createPerpsDepositQuoteStore(
  useAmountStore: PerpsDepositAmountStoreType,
  useDepositStore: PerpsDepositStoreType
): PerpsDepositQuoteStoreType {
  return createQueryStore({
    fetcher: fetchCrosschainQuote,
    params: {
      accountAddress: $ => $(useWalletsStore).accountAddress,
      amount: $ => $(useAmountStore, state => state.amount),
      asset: $ => $(useDepositStore, selectDepositAsset, shallowEqual),
    },
    cacheTime: time.seconds(30),
    paramChangeThrottle: 'microtask',
    staleTime: time.seconds(15),
  });
}

enum KnownErrorMessages {
  ErrorParsingSellAmount = 'error parsing sellAmount',
  QuoteRequestFailed = 'both socket and relay quote requests failed',
}

function shouldSuppressError(error: QuoteError | unknown): boolean {
  switch (ensureError(error).message) {
    case KnownErrorMessages.ErrorParsingSellAmount:
      return true;
    case KnownErrorMessages.QuoteRequestFailed:
    default:
      return false;
  }
}

async function fetchCrosschainQuote(
  { accountAddress, amount, asset }: QuoteStoreParams,
  abortController: AbortController | null
): Promise<CrosschainQuote | QuoteStatus.InsufficientBalance | null> {
  if (!asset) return null;

  const normalizedAmount = stripNonDecimalNumbers(amount) || '0';

  if (equalWorklet(normalizedAmount, '0')) return null;
  if (greaterThanWorklet(normalizedAmount, asset.balance)) {
    return QuoteStatus.InsufficientBalance;
  }

  const quoteParams: QuoteParams = {
    buyTokenAddress: HYPERLIQUID_USDC_ADDRESS,
    chainId: asset.chainId,
    currency: userAssetsStoreManager.getState().currency,
    fromAddress: accountAddress,
    sellAmount: convertAmountToRawAmount(normalizedAmount, asset.decimals),
    sellTokenAddress: asset.address,
    slippage: 1,
    toChainId: HYPERCORE_PSEUDO_CHAIN_ID,
  };

  const quoteResult = await getCrosschainQuote(quoteParams, abortController?.signal);
  if (!quoteResult) return null;

  try {
    if ('error' in quoteResult) throw new Error(quoteResult.message);
  } catch (error: QuoteError | unknown) {
    if (shouldSuppressError(error)) return null;
    throw error;
  }

  return quoteResult;
}

function selectDepositAsset(state: InferStoreState<PerpsDepositStoreType>): QuoteStoreParams['asset'] | null {
  return {
    address: state.asset?.address ?? '',
    balance: state.asset?.balance?.amount ?? '0',
    chainId: state.asset?.chainId ?? ChainId.mainnet,
    decimals: state.asset?.decimals ?? 18,
  };
}
