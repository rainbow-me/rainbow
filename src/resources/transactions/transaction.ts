import { NativeCurrencyKey, RainbowTransaction } from '@/entities';
import { createQueryKey, queryClient, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { consolidatedTransactionsQueryFunction, consolidatedTransactionsQueryKey } from './consolidatedTransactions';
import { useAccountSettings } from '@/hooks';
import { RainbowNetworks, getNetworkObj } from '@/networks';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { parseTransaction } from '@/parsers/transactions';
import { Network } from '@/networks/types';
import { RainbowError, logger } from '@/logger';
import { TransactionApiResponse } from './types';

export type ConsolidatedTransactionsResult = QueryFunctionResult<typeof consolidatedTransactionsQueryFunction>;
export type PaginatedTransactions = { pages: ConsolidatedTransactionsResult[] };

export type TransactionArgs = {
  hash: string;
  address: string;
  currency: NativeCurrencyKey;
  network: Network;
};

type TransactionQueryKey = ReturnType<typeof transactionQueryKey>;

export type BackendTransactionArgs = {
  hash: string;
  network: Network;
  enabled: boolean;
};

export const transactionQueryKey = ({ hash, address, currency, network }: TransactionArgs) =>
  createQueryKey('transactions', { address, currency, network, hash }, { persisterVersion: 1 });

export const fetchTransaction = async ({
  queryKey: [{ address, currency, network, hash }],
}: QueryFunctionArgs<typeof transactionQueryKey>): Promise<RainbowTransaction | null> => {
  try {
    const chainId = getNetworkObj(network).id;
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
    const parsedTx = await parseTransaction(tx, currency);
    if (!parsedTx) throw new Error('Failed to parse transaction');
    return parsedTx;
  } catch (e) {
    logger.error(new RainbowError('fetchTransaction: '), {
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
  network,
  hash,
}: {
  address: string;
  currency: NativeCurrencyKey;
  network: Network;
  hash: string;
}) => queryClient.fetchQuery(transactionQueryKey({ address, currency, network, hash }), fetchTransaction);

export function useBackendTransaction({ hash, network }: BackendTransactionArgs) {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const chainIds = RainbowNetworks.filter(network => network.enabled && network.networkType !== 'testnet').map(network => network.id);

  const paginatedTransactionsKey = consolidatedTransactionsQueryKey({
    address: accountAddress,
    currency: nativeCurrency,
    chainIds,
  });

  const params: TransactionArgs = {
    hash: hash,
    address: accountAddress,
    currency: nativeCurrency,
    network: network,
  };

  return useQuery(transactionQueryKey(params), fetchTransaction, {
    enabled: !!hash && !!accountAddress && !!network,
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

export const useTransaction = ({ network, hash }: { network: Network; hash: string }) => {
  const {
    data: backendTransaction,
    isLoading: backendTransactionIsLoading,
    isFetched: backendTransactionIsFetched,
  } = useBackendTransaction({
    hash,
    network,
    enabled: !!hash && !!network,
  });

  return {
    data: backendTransaction,
    isLoading: backendTransactionIsLoading,
    isFetched: backendTransactionIsFetched,
  };
};
