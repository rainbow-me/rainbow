import { createDerivedStore, createQueryStore } from '@storesjs/stores';
import { createPublicClient, http, type PublicClient } from 'viem';

import { isCrosschainQuote, isQuote } from '@/__swaps__/utils/quotes';
import { getProvider } from '@/handlers/web3';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { buildAtomicExecutionRequirements, isPreparedCallsExecutionSponsored, prepareAtomicSwapCalls } from '@/raps/atomicSwapPreparation';
import { backendNetworksActions, useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { getAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';
import { execute, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote, type QuoteError } from '@rainbow-me/swaps';

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
    const accountAddress = $(useWalletsStore, s => s.accountAddress);
    const quote = $(useSwapsStore, s => s.quote);

    if (!isValidSponsoredSwapQuote(quote, accountAddress)) return null;

    return performance.now();
  },
  { lockDependencies: true }
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

  (_, get) => {
    let consumedQuoteKey: number | null = null;

    return {
      getPreparedSwap: async () => {
        const quoteKey = useSponsoredSwapQuoteKey.getState();
        if (quoteKey === null) return null;

        const shouldForceRefresh = consumedQuoteKey === quoteKey;
        consumedQuoteKey = quoteKey;

        return get().fetch({ quoteKey }, shouldForceRefresh ? { force: true } : undefined);
      },
    };
  }
);

export const useIsSponsoredSwap = createDerivedStore<boolean>(
  $ => {
    const canDelegate = $(useWalletsStore, s => canUseDelegatedExecution(s.accountAddress));
    const inputChainId = $(useSwapsStore, s => s.inputAsset?.chainId);
    const preparedSwap = $(useSponsoredSwapStore, s => s.getData());
    const sponsoredSwapsEnabled = $(useRemoteConfigStore, s => s.config.sponsored_swaps_enabled);

    if (!sponsoredSwapsEnabled) return false;

    const canSponsor = canDelegate && (inputChainId === undefined || backendNetworksActions.isSponsorshipEligible(inputChainId));
    if (!canSponsor || !preparedSwap) return canSponsor;

    return isPreparedCallsExecutionSponsored(preparedSwap);
  },
  { lockDependencies: true }
);

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
    requirements: buildAtomicExecutionRequirements(chainId),
  });
}

// ============ Local Helpers ================================================= //

function readCurrentSwapQuote(): CurrentSponsoredSwap | null {
  const address = getAccountAddress();
  const quote = useSwapsStore.getState().quote;

  if (!isValidSponsoredSwapQuote(quote, address)) return null;

  return { chainId: quote.chainId, quote };
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

function isValidSponsoredSwapQuote(
  quote: Quote | CrosschainQuote | QuoteError | null,
  accountAddress: string
): quote is Quote | CrosschainQuote {
  if (!(isQuote(quote) || isCrosschainQuote(quote))) {
    return false;
  }
  return quote.from.toLowerCase() === accountAddress.toLowerCase();
}
