import { type Address } from 'viem';

import { createPreparedCallsStore, type PreparedCallsStore } from '@/features/delegation/stores/preparedCallsStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { type PreparedCallsExecution } from '@rainbow-me/delegation';

import { type DepositConfig, type DepositGasHookParams, type DepositQuoteResult } from '../types';
import { buildDepositQuoteKey } from '../utils/depositQuoteKey';
import { isValidQuote } from '../utils/quotes';
import { prepareSponsoredDepositExecution } from './prepareSponsoredDepositExecution';
import { determineStrategy } from './strategy';

// ============ Types ========================================================= //

type SponsoredDepositQueryParams = {
  accountAddress: Address;
  sourceChainId: ChainId;
  quoteKey: string;
};

type CreateDepositPreparedCallsStoreParams = {
  config: Pick<DepositConfig, 'directTransferEnabled' | 'to'>;
  readCurrentQuote: () => DepositQuoteResult;
};

export type DepositPreparedCallsStore = PreparedCallsStore<PreparedCallsExecution, SponsoredDepositQueryParams>;

// ============ Store Factory ================================================= //

export function createDepositPreparedCallsStore({
  config,
  readCurrentQuote,
}: CreateDepositPreparedCallsStoreParams): DepositPreparedCallsStore {
  return createPreparedCallsStore<PreparedCallsExecution, SponsoredDepositQueryParams>(
    async ({ accountAddress, sourceChainId, quoteKey }) => {
      const quote = readCurrentQuote();
      if (!isValidQuote(quote)) return null;
      if (buildDepositQuoteKey(quote) !== quoteKey) return null;
      if (quote.chainId !== sourceChainId) return null;
      if (quote.from.toLowerCase() !== accountAddress.toLowerCase()) return null;

      return prepareSponsoredDepositExecution({
        accountAddress,
        chainId: sourceChainId,
        provider: getProvider({ chainId: sourceChainId }),
        quote,
        strategy: determineStrategy(config, quote, accountAddress),
      });
    },
    {
      cacheTime: time.minutes(1),
      staleTime: time.seconds(12),
    }
  );
}

// ============ Param Adapters ================================================ //

export function getDepositPreparedCalls(
  store: DepositPreparedCallsStore,
  params: DepositGasHookParams
): Promise<PreparedCallsExecution | null> {
  const queryParams = toSponsoredDepositQueryParams(params);
  if (!queryParams) return Promise.resolve(null);
  return store.getState().getPreparedCalls(queryParams);
}

function toSponsoredDepositQueryParams(params: DepositGasHookParams): SponsoredDepositQueryParams | null {
  if (!isValidQuote(params.quote)) return null;

  if (params.quote.chainId !== params.asset.chainId) return null;
  if (params.quote.from.toLowerCase() !== params.accountAddress.toLowerCase()) return null;

  return {
    accountAddress: params.accountAddress,
    quoteKey: buildDepositQuoteKey(params.quote),
    sourceChainId: params.asset.chainId,
  };
}
