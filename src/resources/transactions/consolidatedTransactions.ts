import { useInfiniteQuery } from '@tanstack/react-query';
import { InfiniteQueryConfig, QueryConfig, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { NativeCurrencyKey, RainbowTransaction, TransactionApiResponse, TransactionsReceivedMessage } from '@/entities';
import { RainbowError, logger } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAddysHttpClient } from '@/resources/addys/client';

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
  try {
    const chainIdsString = chainIds.join(',');
    const response = await getAddysHttpClient().get(`/${chainIdsString}/${address}/transactions`, {
      method: 'get',
      params: {
        currency: currency.toLowerCase(),
        ...(pageParam ? { pageCursor: pageParam } : {}),
      },
    });

    const consolidatedTransactions = await parseConsolidatedTransactions(response?.data, currency);

    return {
      cutoff: response?.data?.meta?.cut_off,
      nextPage: response?.data?.meta?.next_page_cursor,
      transactions: consolidatedTransactions,
    };
  } catch (e) {
    logger.error(new RainbowError('[consolidatedTransactions]: '), {
      message: e,
    });
    return { transactions: [] };
  }
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
  return useInfiniteQuery(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds: useBackendNetworksStore.getState().getSupportedMainnetChainIds(),
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
