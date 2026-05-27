import { createDerivedStore } from '@storesjs/stores';

import { isCrosschainQuote, isQuote } from '@/__swaps__/utils/quotes';
import { createDelegationPublicClient, isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { createPreparedCallsStore } from '@/features/delegation/preparedCallsStore';
import { predictSponsoredCallsExecution } from '@/features/delegation/sponsoredCalls';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { buildAtomicExecutionRequirements, prepareAtomicSwapCalls } from '@/raps/atomicSwapPreparation';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { getAccountAddress, useWalletsStore } from '@/state/wallets/walletsStore';
import { execute, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote, type QuoteError } from '@rainbow-me/swaps';

import { supportsDelegatedExecution } from './willDelegate';

// ============ Types ========================================================== //

type SponsoredSwapParams = {
  quoteKey: number | null;
};

type CurrentSponsoredSwap = {
  chainId: number;
  quote: Quote | CrosschainQuote;
};

// ============ Quote Key ====================================================== //

const useSponsoredSwapQuoteKey = createDerivedStore(
  $ => {
    const accountAddress = $(useWalletsStore, s => s.accountAddress);
    const quote = $(useSwapsStore, s => s.quote);
    const sponsorshipEligibleChainIds = $(useBackendNetworksStore, s => s.getSponsorshipEligibleChainIds());
    const sponsoredSwapsEnabled = $(useRemoteConfigStore, s => s.config.sponsored_swaps_enabled);

    if (!isValidSponsoredSwapQuote(quote, accountAddress)) return null;
    if (!sponsoredSwapsEnabled || !sponsorshipEligibleChainIds.includes(quote.chainId)) return null;

    return performance.now();
  },
  { lockDependencies: true }
);

// ============ Stores ========================================================= //

export const useSponsoredSwapStore = createPreparedCallsStore<PreparedCallsExecution, SponsoredSwapParams>(fetchPreparedSponsoredSwap, {
  enabled: $ => $(useSponsoredSwapQuoteKey, quoteKey => quoteKey !== null),
  params: {
    quoteKey: $ => $(useSponsoredSwapQuoteKey),
  },
  cacheTime: time.minutes(1),
  staleTime: time.seconds(12),
});

export const useIsSponsoredSwap = createDerivedStore<boolean>(
  $ => {
    const address = $(useWalletsStore, s => s.accountAddress);
    const chainId = $(useSwapsStore, s => s.inputAsset?.chainId ?? null);
    const sponsorshipEligibleChainIds = $(useBackendNetworksStore, s => s.getSponsorshipEligibleChainIds());
    const hasPreparedSwap = $(useSponsoredSwapStore, s => !s.isDataExpired());
    const preparedSwap = $(useSponsoredSwapStore, s => s.getData());
    const sponsoredSwapsEnabled = $(useRemoteConfigStore, s => s.config.sponsored_swaps_enabled);

    if (!sponsoredSwapsEnabled) return false;

    const canSponsor = predictSponsoredCallsExecution({ address, chainId, sponsorshipEligibleChainIds });
    if (!canSponsor || !hasPreparedSwap) return canSponsor;

    return isPreparedCallsExecutionSponsored(preparedSwap);
  },
  { lockDependencies: true }
);

// ============ Public Helpers ================================================= //

export function getPreparedSponsoredSwap(): Promise<PreparedCallsExecution | null> {
  const quoteKey = useSponsoredSwapQuoteKey.getState();
  if (quoteKey === null) return Promise.resolve(null);

  return useSponsoredSwapStore.getState().getPreparedCalls({ quoteKey });
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

  const publicClient = createDelegationPublicClient(chainId);

  return execute.prepare.calls({
    account: address,
    chainId,
    calls,
    publicClient,
    requirements: buildAtomicExecutionRequirements(chainId),
  });
}

// ============ Local Helpers ================================================== //

function readCurrentSwapQuote(): CurrentSponsoredSwap | null {
  const address = getAccountAddress();
  const quote = useSwapsStore.getState().quote;

  if (!isValidSponsoredSwapQuote(quote, address)) return null;

  return { chainId: quote.chainId, quote };
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
