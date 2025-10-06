import { useInfiniteQuery } from '@tanstack/react-query';
import { InfiniteQueryConfig, QueryConfig, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import {
  ListTransactionsResponse,
  NativeCurrencyKey,
  NormalizedTransactionApiResponse,
  RainbowTransaction,
  TransactionApiResponse,
} from '@/entities';
import { RainbowError, logger } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { IS_TEST } from '@/env';
import { anvilChain, e2eAnvilConfirmedTransactions } from './transaction';
import { getPlatformClient } from '@/resources/platform/client';
import { ChainId } from '@/state/backendNetworks/types';

const CONSOLIDATED_TRANSACTIONS_INTERVAL = 30000;

// ///////////////////////////////////////////////
// Query Types

export type ConsolidatedTransactionsArgs = {
  address: string;
  currency: NativeCurrencyKey;
  chainIds: number[];
};

// ///////////////////////////////////////////////
// Query Key

export const consolidatedTransactionsQueryKey = ({ address, currency, chainIds }: ConsolidatedTransactionsArgs) =>
  createQueryKey('consolidatedTransactions', { address, currency, chainIds }, { persisterVersion: 2 });

type ConsolidatedTransactionsQueryKey = ReturnType<typeof consolidatedTransactionsQueryKey>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchConsolidatedTransactions<ConsolidatedTransactionsResult>(
  { address, currency, chainIds }: ConsolidatedTransactionsArgs,
  config: QueryConfig<ConsolidatedTransactionsResult, Error, ConsolidatedTransactionsQueryKey>
) {
  return await queryClient.fetchQuery(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds,
    }),
    consolidatedTransactionsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Function

type _QueryResult = {
  cutoff?: number;
  nextPage?: string;
  transactions: RainbowTransaction[] | [];
};

export async function consolidatedTransactionsQueryFunction({
  queryKey: [{ address, currency, chainIds }],
  pageParam,
}: QueryFunctionArgs<typeof consolidatedTransactionsQueryKey>): Promise<_QueryResult> {
  let transactionsFromGoldsky: RainbowTransaction[] = [];
  let nextPageFromGoldsky: string | undefined;
  let cutoffFromGoldsky: number | undefined;
  try {
    const cursor = typeof pageParam === 'string' ? pageParam : undefined;

    const { data } = await getPlatformClient().get<ListTransactionsResponse>('/transactions/ListTransactions', {
      method: 'get',
      params: {
        address,
        chainIds: chainIds.join(','),
        currency: currency.toLowerCase(),
        limit: String(30),
        ...(cursor ? { cursor } : {}),
      },
    });
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.log('consolidatedTransactionsQueryFunction data:', JSON.stringify(data, null, 2)); // __AUTO_GENERATED_PRINT_VAR_END__

    const payload = extractTransactionsPayload(data);

    transactionsFromGoldsky = await parseConsolidatedTransactions(payload, currency);
    nextPageFromGoldsky = payload?.pagination?.cursor;
  } catch (e) {
    logger.error(new RainbowError('[consolidatedTransactions]: Error fetching from GoldSky', e), {
      message: e,
    });
  }

  let finalTransactions: RainbowTransaction[] = [...transactionsFromGoldsky];
  if (IS_TEST && chainIds && chainIds.includes(anvilChain.id)) {
    const userAnvilTransactions = e2eAnvilConfirmedTransactions.filter(tx => {
      const fromMatch = tx.from && tx.from.toLowerCase() === address.toLowerCase();
      const toMatch = tx.to && tx.to.toLowerCase() === address.toLowerCase();
      return fromMatch || toMatch;
    });
    const combinedTransactions = [...userAnvilTransactions, ...finalTransactions];

    const uniqueTransactionsMap = new Map<string, RainbowTransaction>();
    for (const tx of combinedTransactions) {
      if (tx.hash && !uniqueTransactionsMap.has(tx.hash)) {
        uniqueTransactionsMap.set(tx.hash, tx);
      }
    }
    finalTransactions = Array.from(uniqueTransactionsMap.values());

    // Sort by timestamp (minedAt) in descending order if available, otherwise keep Anvil Txs at top
    finalTransactions.sort((a, b) => {
      const aTime = a.minedAt || (a.chainId === anvilChain.id ? Infinity : 0);
      const bTime = b.minedAt || (b.chainId === anvilChain.id ? Infinity : 0);
      return bTime - aTime;
    });
  }

  return {
    transactions: finalTransactions,
    nextPage: nextPageFromGoldsky,
    cutoff: cutoffFromGoldsky,
  };
}

type ConsolidatedTransactionsResult = {
  cutoff?: number;
  nextPage?: string;
  transactions: RainbowTransaction[];
};
/**
 * 
 * should we? 
 *   queryClient.invalidateQueries({
        queryKey: nftsQueryKey({ address: accountAddress }),
      });
 */
async function parseConsolidatedTransactions(
  message: ListTransactionsResponse | undefined,
  currency: NativeCurrencyKey
): Promise<RainbowTransaction[]> {
  const data = message?.result || [];

  if (!data.length) {
    return [];
  }

  const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();

  const parsedTransactionPromises = data.flatMap(tx => {
    const chainId = resolveChainId(tx, chainsIdByName);

    if (!chainId) {
      return [];
    }

    const normalizedTransaction = normalizeTransactionPayload(tx as NormalizedTransactionApiResponse);

    return [parseTransaction(normalizedTransaction, currency, chainId)];
  });

  return (await Promise.all(parsedTransactionPromises)).flat();
}

type TransactionChainMap = Record<string, ChainId>;

function resolveChainId(tx: TransactionApiResponse, chainsIdByName: TransactionChainMap): ChainId | undefined {
  const chainFromNetwork = chainsIdByName[tx.network];
  if (chainFromNetwork) {
    return chainFromNetwork;
  }

  const parsedChainId = Number(tx.chainId);
  if (!Number.isNaN(parsedChainId)) {
    return parsedChainId as ChainId;
  }

  logger.warn('[consolidatedTransactions]: Received transaction with unknown network', {
    network: tx.network,
    chainId: tx.chainId,
  });
  return undefined;
}

function normalizeTransactionPayload(tx: TransactionApiResponse): NormalizedTransactionApiResponse {
  const blockNumber = toNumber(tx.blockNumber);
  const blockConfirmations = 0; // Not provided in API response
  const nonce = toNumber(tx.nonce, 0);
  const minedAtSeconds = normalizeMinedAt(tx.minedAt);

  return {
    ...tx,
    blockNumber,
    blockConfirmations,
    nonce,
    minedAt: minedAtSeconds,
  };
}

function toNumber(value: number | string | null | undefined, fallback?: number): number {
  if (value === null || value === undefined || value === '') {
    return fallback ?? 0;
  }

  return typeof value === 'string' ? Number(value) : value;
}

function normalizeMinedAt(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Math.floor(value < 10_000_000_000 ? value : value / 1000);
  }

  const timestampMs = new Date(value).getTime();
  if (Number.isNaN(timestampMs) || timestampMs === 0) {
    return undefined;
  }

  return Math.floor(timestampMs / 1000);
}

function extractTransactionsPayload(
  response: ListTransactionsResponse | { data?: ListTransactionsResponse } | undefined
): ListTransactionsResponse | undefined {
  if (!response) {
    return undefined;
  }

  if ('result' in response && Array.isArray(response.result)) {
    return response;
  }

  if ('data' in response && response.data && Array.isArray(response.data.result)) {
    return response.data;
  }

  return undefined;
}

// ///////////////////////////////////////////////
// Query Hook

export function useConsolidatedTransactions(
  { address, currency }: Pick<ConsolidatedTransactionsArgs, 'address' | 'currency'>,
  config: InfiniteQueryConfig<ConsolidatedTransactionsResult, Error, ConsolidatedTransactionsResult> = {}
) {
  const mainnetChainIds = useBackendNetworksStore.getState().getSupportedMainnetChainIds();
  let effectiveChainIds = mainnetChainIds;

  if (IS_TEST) {
    // Add Anvil's chain ID if it's not already there for testing purposes
    if (!effectiveChainIds.includes(anvilChain.id)) {
      effectiveChainIds = [anvilChain.id, ...effectiveChainIds];
    }
  }

  return useInfiniteQuery(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds: effectiveChainIds,
    }),
    consolidatedTransactionsQueryFunction,
    {
      ...config,
      keepPreviousData: true,
      getNextPageParam: lastPage => lastPage?.nextPage,
      refetchInterval: CONSOLIDATED_TRANSACTIONS_INTERVAL,
      enabled: !!address,
      retry: 3,
    }
  );
}
