import { VoidSigner } from '@ethersproject/abstract-signer';
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
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';
import { isDelegationEnabled } from './featureFlags';

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
    const isWalletEligible = $(useWalletsStore, state => !state.getIsHardwareWallet() && !state.getIsReadOnlyWallet());
    const quote = $(useSwapsStore, state => state.quote);

    if (!accountAddress || !isWalletEligible) return null;
    if (!isDelegationEnabled() || !isCurrentSponsoredSwapQuote(quote, accountAddress)) return null;

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
  const current = readCurrentSponsoredSwap();
  if (!current) return null;

  const signer = new VoidSigner(current.quote.from, getProvider({ chainId: current.chainId }));
  const publicClient = createDelegationPublicClient(current);

  const calls = await prepareAtomicSwapCalls({
    chainId: current.chainId,
    quote: current.quote,
    signer,
  });

  return execute.prepare.calls({
    account: current.quote.from,
    chainId: current.chainId,
    calls,
    publicClient,
    requirements: {
      atomic: 'required',
      fees: { payer: 'sponsor' },
    },
  });
}

// ============ Local Helpers ================================================= //

function readCurrentSponsoredSwap(): CurrentSponsoredSwap | null {
  const { accountAddress, getIsHardwareWallet, getIsReadOnlyWallet } = useWalletsStore.getState();
  const quote = useSwapsStore.getState().quote;

  if (!isDelegationEnabled()) return null;
  if (!accountAddress || getIsHardwareWallet() || getIsReadOnlyWallet()) return null;

  if (!isCurrentSponsoredSwapQuote(quote, accountAddress)) return null;

  return {
    chainId: quote.chainId,
    quote,
  };
}

function isCurrentSponsoredSwapQuote(
  quote: Quote | CrosschainQuote | QuoteError | null,
  accountAddress: string
): quote is Quote | CrosschainQuote {
  if (!(isQuote(quote) || isCrosschainQuote(quote))) return false;
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
