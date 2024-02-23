import { useInfiniteQuery } from '@tanstack/react-query';
import { InfiniteQueryConfig, QueryConfig, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { NativeCurrencyKey, RainbowTransaction } from '@/entities';
import { TransactionApiResponse, TransactionsReceivedMessage } from './types';
import { RainbowError, logger } from '@/logger';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { RainbowNetworks } from '@/networks';
import { parseTransaction } from '@/parsers/transactions';

const CONSOLIDATED_TRANSACTIONS_INTERVAL = 30000;
const CONSOLIDATED_TRANSACTIONS_TIMEOUT = 20000;

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
    const url = `https://addys.p.rainbow.me/v3/${chainIdsString}/${address}/transactions`;
    const response = await rainbowFetch(url, {
      method: 'get',
      params: {
        currency: currency.toLowerCase(),
        ...(pageParam ? { pageCursor: pageParam } : {}),
      },
      timeout: CONSOLIDATED_TRANSACTIONS_TIMEOUT,
      headers: {
        Authorization: `Bearer ${ADDYS_API_KEY}`,
      },
    });

    const consolidatedTransactions = await parseConsolidatedTransactions(response?.data, currency);

    return {
      cutoff: response?.data?.meta?.cut_off,
      nextPage: response?.data?.meta?.next_page_cursor,
      transactions: consolidatedTransactions,
    };
  } catch (e) {
    logger.error(new RainbowError('consolidatedTransactionsQueryFunction: '), {
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

  const parsedTransactionPromises = data.map((tx: TransactionApiResponse) => parseTransaction(tx, currency));
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
  const chainIds = RainbowNetworks.filter(network => network.enabled && network.networkType !== 'testnet').map(network => network.id);

  return useInfiniteQuery(
    consolidatedTransactionsQueryKey({
      address,
      currency,
      chainIds,
    }),
    consolidatedTransactionsQueryFunction,
    {
      ...config,
      keepPreviousData: true,
      getNextPageParam: lastPage => lastPage?.nextPage,
      refetchInterval: CONSOLIDATED_TRANSACTIONS_INTERVAL,
      retry: 3,
    }
  );
}
