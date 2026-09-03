import { useInfiniteQuery } from '@tanstack/react-query';

import { type RainbowTransaction } from '@/entities/transactions';
import { IS_TEST } from '@/env';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ListTransactionsResponse, type Transaction } from '@/features/positions/types/generated/transaction/transaction';
import { fetchSolanaTransactions } from '@/features/solana/data/fetchSolanaTransactions';
import { logger, RainbowError } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { createQueryKey, queryClient, type InfiniteQueryConfig, type QueryConfig, type QueryFunctionArgs } from '@/react-query';
import { getPlatformClient } from '@/resources/platform/client';

import { anvilChain, e2eAnvilConfirmedTransactions } from './transaction';

const CONSOLIDATED_TRANSACTIONS_INTERVAL = 30000;
const CONSOLIDATED_TRANSACTIONS_LIMIT = 30;

const EMPTY_SOLANA_TRANSACTIONS: Promise<RainbowTransaction[]> = Promise.resolve([]);

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
  createQueryKey('consolidatedTransactions', { address, currency, chainIds }, { persisterVersion: 1 });

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
  let nextPageFromGoldsky: string | undefined = pageParam;
  let cutoffFromGoldsky: number | undefined;

  const cursor = typeof pageParam === 'string' ? pageParam : undefined;

  // Started before the EVM request is awaited so it costs no extra wall-clock, and
  // merged after it because a Solana failure must not cost the EVM rows: this
  // function never rejects and returns an empty list when the flag is off. Only the
  // first page asks, because the fake serves one page and this list is appended to
  // rather than replaced; a cursor request would otherwise repeat the same rows on
  // every page forever.
  const solanaTransactions = cursor
    ? EMPTY_SOLANA_TRANSACTIONS
    : fetchSolanaTransactions({ currency, limit: CONSOLIDATED_TRANSACTIONS_LIMIT });

  try {
    const chainIdsString = chainIds.join(',');

    const { data } = await getPlatformClient().get<ListTransactionsResponse>('/transactions/ListTransactions', {
      method: 'get',
      params: {
        address,
        chainIds: chainIdsString,
        currency: currency.toLowerCase(),
        limit: String(CONSOLIDATED_TRANSACTIONS_LIMIT),
        ...(cursor ? { cursor } : {}),
      },
    });

    // A resultless EVM response falls through rather than returning, so that the
    // Solana rows are not lost with it. The EVM values it produces are the ones the
    // early return this replaced produced: no transactions, no next page, no cutoff.
    if (!data.result || !Array.isArray(data.result)) {
      nextPageFromGoldsky = undefined;
    } else {
      const chainsIdByName = backendNetworksActions.getChainsIdByName();

      const parsedTransactions = data.result.map((tx: Transaction) => {
        const chainId = chainsIdByName[tx.network];
        return parseTransaction(tx, currency, chainId);
      });
      transactionsFromGoldsky = parsedTransactions.flat();
      nextPageFromGoldsky = data?.pagination?.cursor;
    }
  } catch (e) {
    logger.error(new RainbowError('[consolidatedTransactions]: Error fetching from Goldsky', e), {
      message: e,
    });
  }

  // Interleaved by mined time rather than appended, because the activity list's
  // sections are time buckets: a Solana row appended after the EVM rows would sit at
  // the bottom of its day instead of in date order. The sort runs only when Solana
  // rows are present, so the EVM-only path is byte-for-byte what it was.
  const solanaRows = await solanaTransactions;
  let finalTransactions: RainbowTransaction[] =
    solanaRows.length > 0
      ? [...transactionsFromGoldsky, ...solanaRows].sort((a, b) => (b.minedAt ?? 0) - (a.minedAt ?? 0))
      : [...transactionsFromGoldsky];
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

// ///////////////////////////////////////////////
// Query Hook

export function useConsolidatedTransactions(
  { address, currency }: Pick<ConsolidatedTransactionsArgs, 'address' | 'currency'>,
  config: InfiniteQueryConfig<ConsolidatedTransactionsResult, Error, ConsolidatedTransactionsResult> = {}
) {
  const chainIds = backendNetworksActions.getSupportedMainnetChainIds();

  return useInfiniteQuery(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds,
    }),
    consolidatedTransactionsQueryFunction,
    {
      ...config,
      getNextPageParam: lastPage => lastPage?.nextPage,
      refetchInterval: CONSOLIDATED_TRANSACTIONS_INTERVAL,
      enabled: !!address,
      retry: 3,
    }
  );
}
