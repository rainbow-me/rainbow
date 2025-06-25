import { useInfiniteQuery } from '@tanstack/react-query';
import { InfiniteQueryConfig, QueryConfig, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { NativeCurrencyKey, RainbowTransaction, TransactionApiResponse, TransactionsReceivedMessage } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '@/resources/addys/client';
import { IS_TEST } from '@/env';
import { anvilChain, e2eAnvilConfirmedTransactions } from './transaction';

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
  let transactionsFromAddys: RainbowTransaction[] = [];
  let nextPageFromAddys: string | undefined = pageParam;
  let cutoffFromAddys: number | undefined;
  try {
    const chainIdsString = chainIds.join(',');
    const response = await getAddysHttpClient().get(`/${chainIdsString}/${address}/transactions`, {
      method: 'get',
      params: {
        currency: currency.toLowerCase(),
        ...(pageParam ? { pageCursor: pageParam } : {}),
      },
    });

    transactionsFromAddys = await parseConsolidatedTransactions(response?.data, currency);
    nextPageFromAddys = response?.data?.meta?.next_page_cursor;
    cutoffFromAddys = response?.data?.meta?.cut_off;
  } catch (e) {
    logger.error(new RainbowError('[consolidatedTransactions]: Error fetching from Addys', e), {
      message: e,
    });
  }

  let finalTransactions: RainbowTransaction[] = [...transactionsFromAddys];
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
    nextPage: nextPageFromAddys,
    cutoff: cutoffFromAddys,
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
  message: TransactionsReceivedMessage,
  currency: NativeCurrencyKey
): Promise<RainbowTransaction[]> {
  const data = message?.payload?.transactions || [];

  const chainsIdByName = useBackendNetworksStore.getState().getChainsIdByName();

  const parsedTransactionPromises = data.map((tx: TransactionApiResponse) => parseTransaction(tx, currency, chainsIdByName[tx.network]));
  // Filter out undefined values immediately

  const parsedConsolidatedTransactions = (await Promise.all(parsedTransactionPromises)).flat(); // Filter out any remaining undefined values

  return parsedConsolidatedTransactions;
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
