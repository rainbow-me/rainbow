import { execute, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote, type QuoteError } from '@rainbow-me/swaps';
import { createPublicClient, http, type PublicClient } from 'viem';
import { isCrosschainQuote, isQuote } from '@/__swaps__/utils/quotes';
import { getProvider } from '@/handlers/web3';
import { isPreparedCallsExecutionSponsored, prepareAtomicSwapCalls } from '@/raps/atomicSwapPreparation';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { getAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';
import { canUseDelegatedExecution, supportsDelegatedExecution } from './willDelegate';

// ============ Constants ====================================================== //

const SPONSORED_SWAP_STALE_TIME_MS = time.seconds(12);

// ============ Types ========================================================= //

type SponsoredSwapParams = {
  quoteKey: number | null;
};

type SponsoredSwapActions = {
  getPreparedSwap: () => Promise<PreparedCallsExecution | null>;
};

type CurrentSponsoredSwap = {
  chainId: number;
  quote: Quote | CrosschainQuote;
};

// ============ Quote Key ===================================================== //

const useSponsoredSwapQuoteKey = createDerivedStore(
  $ => {
    const accountAddress = $(useWalletsStore, state => state.accountAddress);
    const quote = $(useSwapsStore, state => state.quote);

    if (!accountAddress || !canUseDelegatedExecution(accountAddress)) return null;
    if (!isCurrentSponsoredSwapQuote(quote, accountAddress)) return null;

    return performance.now();
  },
  { fastMode: true }
);

// ============ Store ========================================================= //

export const useSponsoredSwapStore = createQueryStore<PreparedCallsExecution | null, SponsoredSwapParams, SponsoredSwapActions>(
  {
    fetcher: fetchPreparedSponsoredSwap,
    enabled: $ => $(useSponsoredSwapQuoteKey, quoteKey => quoteKey !== null),
    params: {
      quoteKey: $ => $(useSponsoredSwapQuoteKey),
    },
    keepPreviousData: true,
    cacheTime: time.minutes(1),
    staleTime: SPONSORED_SWAP_STALE_TIME_MS,
  },

  (_, get) => ({
    getPreparedSwap: async (): Promise<PreparedCallsExecution | null> => {
      const quoteKey = useSponsoredSwapQuoteKey.getState();
      if (quoteKey === null) return null;
      return get().fetch({ quoteKey });
    },
  })
);

export function useIsSponsoredSwap(): boolean {
  return useSponsoredSwapStore(state => isPreparedCallsExecutionSponsored(state.getData()));
}

// ============ Fetcher ======================================================== //

async function fetchPreparedSponsoredSwap(): Promise<PreparedCallsExecution | null> {
  const current = readCurrentSwapQuote();
  if (!current) return null;

  const address = current.quote.from;
  const chainId = current.chainId;

  const canExecuteAtomically = await supportsDelegatedExecution({ address, chainId });
  if (!canExecuteAtomically) return null;

  const calls = await prepareAtomicSwapCalls({
    account: address,
    chainId,
    provider: getProvider({ chainId }),
    quote: current.quote,
  });

  const publicClient = createDelegationPublicClient(current);

  return execute.prepare.calls({
    account: address,
    chainId,
    calls,
    publicClient,
    requirements: {
      atomic: 'required',
      fees: { payer: 'sponsor' },
    },
  });
}

// ============ Local Helpers ================================================= //

function readCurrentSwapQuote(): CurrentSponsoredSwap | null {
  const address = getAccountAddress();
  const quote = useSwapsStore.getState().quote;

  if (!isCurrentSponsoredSwapQuote(quote, address)) return null;
  if (!canUseDelegatedExecution(address)) return null;

  return { chainId: quote.chainId, quote };
}

function isCurrentSponsoredSwapQuote(
  quote: Quote | CrosschainQuote | QuoteError | null,
  accountAddress: string
): quote is Quote | CrosschainQuote {
  if (!(isQuote(quote) || isCrosschainQuote(quote))) {
    return false;
  }
  return quote.from.toLowerCase() === accountAddress.toLowerCase();
}

function createDelegationPublicClient(current: CurrentSponsoredSwap): PublicClient {
  const backendNetworks = useBackendNetworksStore.getState();
  const chain = backendNetworks.getDefaultChains()[current.chainId];
  const rpcUrl = backendNetworks.getChainDefaultRpc(current.chainId);

  if (!chain) {
    throw new Error(`Unsupported swap chain ${current.chainId}`);
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}
