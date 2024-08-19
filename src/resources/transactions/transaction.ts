import { NativeCurrencyKey, RainbowTransaction } from '@/entities';
import { createQueryKey, queryClient, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { consolidatedTransactionsQueryFunction, consolidatedTransactionsQueryKey } from './consolidatedTransactions';
import { useAccountSettings } from '@/hooks';
import { networkObjects } from '@/networks';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { parseTransaction } from '@/parsers/transactions';
import { RainbowError, logger } from '@/logger';
import { TransactionApiResponse } from './types';
import { ChainId } from '@/networks/types';

export type ConsolidatedTransactionsResult = QueryFunctionResult<typeof consolidatedTransactionsQueryFunction>;
export type PaginatedTransactions = { pages: ConsolidatedTransactionsResult[] };

export type TransactionArgs = {
  hash: string;
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
};

type TransactionQueryKey = ReturnType<typeof transactionQueryKey>;

export type BackendTransactionArgs = {
  hash: string;
  chainId: ChainId;
  enabled: boolean;
};

export const transactionQueryKey = ({ hash, address, currency, chainId }: TransactionArgs) =>
  createQueryKey('transactions', { address, currency, chainId, hash }, { persisterVersion: 1 });

export const fetchTransaction = async ({
  queryKey: [{ address, currency, chainId, hash }],
}: QueryFunctionArgs<typeof transactionQueryKey>): Promise<RainbowTransaction | null> => {
  try {
    const url = `https://addys.p.rainbow.me/v3/${chainId}/${address}/transactions/${hash}`;
    const response = await rainbowFetch<{ payload: { transaction: TransactionApiResponse } }>(url, {
      method: 'get',
      params: {
        currency: currency.toLowerCase(),
      },
      timeout: 20000,
      headers: {
        Authorization: `Bearer ${ADDYS_API_KEY}`,
      },
    });

    const tx = response?.data?.payload?.transaction || {};
    if (!tx) {
      return null;
    }
    const parsedTx = await parseTransaction(tx, currency, chainId);
    if (!parsedTx) throw new Error('Failed to parse transaction');
    return parsedTx;
  } catch (e) {
    logger.error(new RainbowError('[transaction]: Failed to fetch transaction'), {
      message: (e as Error)?.message,
    });
    return null;
  }
};

// ///////////////////////////////////////////////
// Query Function

export const transactionFetchQuery = async ({
  address,
  currency,
  chainId,
  hash,
}: {
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  hash: string;
}) => queryClient.fetchQuery(transactionQueryKey({ address, currency, chainId, hash }), fetchTransaction);

export function useBackendTransaction({ hash, chainId }: BackendTransactionArgs) {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const chainIds = Object.values(networkObjects)
    .filter(network => network.enabled && network.networkType !== 'testnet')
    .map(network => network.id);

  const paginatedTransactionsKey = consolidatedTransactionsQueryKey({
    address: accountAddress,
    currency: nativeCurrency,
    chainIds,
  });

  const params: TransactionArgs = {
    hash: hash,
    address: accountAddress,
    currency: nativeCurrency,
    chainId: chainId,
  };

  return useQuery(transactionQueryKey(params), fetchTransaction, {
    enabled: !!hash && !!accountAddress && !!chainId,
    initialData: () => {
      const queryData = queryClient.getQueryData<PaginatedTransactions>(paginatedTransactionsKey);
      const pages = queryData?.pages || [];
      for (const page of pages) {
        const tx = page.transactions.find(tx => tx.hash === hash);
        if (tx) {
          return tx;
        }
        return {};
      }
    },
    initialDataUpdatedAt: () => queryClient.getQueryState(paginatedTransactionsKey)?.dataUpdatedAt,
  });
}

export const useTransaction = ({ chainId, hash }: { chainId: ChainId; hash: string }) => {
  const {
    data: backendTransaction,
    isLoading: backendTransactionIsLoading,
    isFetched: backendTransactionIsFetched,
  } = useBackendTransaction({
    hash,
    chainId,
    enabled: !!hash && !!chainId,
  });

  return {
    data: backendTransaction,
    isLoading: backendTransactionIsLoading,
    isFetched: backendTransactionIsFetched,
  };
};
