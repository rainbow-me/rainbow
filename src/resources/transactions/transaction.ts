import { useQuery } from '@tanstack/react-query';
import { isHash } from 'viem';

import { TransactionStatus, type MinedTransaction, type RainbowTransaction, type TransactionType } from '@/entities/transactions';
import { IS_TEST } from '@/env';
import { getMockCashTransactionByHash } from '@/features/cash/utils/mockCashTransactionByHash';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { type GetTransactionByHashResponse } from '@/features/positions/types/generated/transaction/transaction';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { ensureError, logger, RainbowError } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { createQueryKey, queryClient, type QueryFunctionArgs, type QueryFunctionResult } from '@/react-query';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { anvilChain, anvilConfirmedTransactions, anvilPublicClient } from './anvil';
import { consolidatedTransactionsQueryKey, type consolidatedTransactionsQueryFunction } from './consolidatedTransactions';

export type ConsolidatedTransactionsResult = QueryFunctionResult<typeof consolidatedTransactionsQueryFunction>;
export type PaginatedTransactions = { pages: ConsolidatedTransactionsResult[] };

export type TransactionArgs = {
  hash: string;
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  originalType?: TransactionType;
};

export type BackendTransactionArgs = {
  hash: string;
  chainId: ChainId;
  enabled: boolean;
};

/**
 * Fetches and parses a transaction by hash.
 * A 404 response returns `null`; other platform request or parsing failures reject.
 */
export async function fetchRawTransaction({
  abortController,
  address,
  currency,
  chainId,
  hash,
  originalType,
}: {
  abortController?: AbortController | null;
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  hash: string;
  originalType?: TransactionType;
}): Promise<RainbowTransaction | null> {
  if (IS_TEST) {
    const mockCashTransaction = await getMockCashTransactionByHash({ address, currency, chainId, hash });
    if (mockCashTransaction) return mockCashTransaction;
  }

  if (IS_TEST && anvilPublicClient && chainId === anvilChain.id) {
    try {
      if (!isHash(hash)) throw new Error('Invalid transaction hash');

      const receipt = await anvilPublicClient.getTransactionReceipt({ hash });
      if (!receipt) return null;

      const status = receipt.status === 'success' ? TransactionStatus.confirmed : TransactionStatus.failed;
      const type = originalType || 'contract_interaction';

      let titleKey: string;
      if (status === TransactionStatus.confirmed) {
        titleKey = `${type}.confirmed`;
      } else if (status === TransactionStatus.failed) {
        titleKey = `${type}.failed`;
      } else {
        titleKey = type;
      }

      const minedTx: MinedTransaction = {
        hash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        from: receipt.from,
        to: receipt.to,
        status,
        chainId,
        minedAt: Math.floor(Date.now() / 1000),
        confirmations: 1,
        gasUsed: receipt.gasUsed.toString(),
        title: titleKey,
        type,
        network: anvilChain.network,
        address: address,
        value: '0',
        nonce: 0,
        data: receipt.logsBloom,
      };

      // Add to our E2E cache if confirmed and not already present
      if (status === TransactionStatus.confirmed) {
        if (!anvilConfirmedTransactions.find(tx => tx.hash === minedTx.hash)) {
          anvilConfirmedTransactions.unshift(minedTx);
        }
      }

      return minedTx;
    } catch (e) {
      logger.error(new RainbowError('[transaction][e2e]: Failed to fetch transaction from Anvil'), {
        message: ensureError(e).message,
        hash,
      });
      return null;
    }
  }

  try {
    const response = await getPlatformClient().get<GetTransactionByHashResponse>('/transactions/GetTransactionByHash', {
      params: {
        currency: currency.toLowerCase(),
        hash,
        address,
        chainIds: String(chainId),
      },
      signal: abortController?.signal,
    });

    if (!response.data.result) throw new Error('No transaction data in response');
    const parsed = parseTransaction(response.data.result, currency, chainId);
    if (!parsed) throw new Error('Failed to parse transaction');

    return parsed;
  } catch (e) {
    if (e instanceof RainbowFetchError && e.response?.status === 404) return null;
    throw e;
  }
}

// ///////////////////////////////////////////////
// Query Function

export const transactionQueryKey = ({ hash, address, currency, chainId, originalType }: TransactionArgs) =>
  createQueryKey('transactions', { address, currency, chainId, hash, originalType }, { persisterVersion: 1 });

/**
 * Fetches a transaction for React Query.
 * Missing transactions return `null`. Other failures are logged and also return `null`.
 */
export async function transactionQueryFn({
  queryKey: [{ address, currency, chainId, hash, originalType }],
}: QueryFunctionArgs<typeof transactionQueryKey>): Promise<RainbowTransaction | null> {
  try {
    return await fetchRawTransaction({ address, currency, chainId, hash, originalType });
  } catch (error) {
    logger.error(new RainbowError('[transaction]: Failed to fetch transaction', error));
    return null;
  }
}

export const fetchCachedTransaction = async ({
  address,
  currency,
  chainId,
  hash,
  originalType,
}: {
  address: string;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  hash: string;
  originalType?: TransactionType;
}) => queryClient.fetchQuery(transactionQueryKey({ address, currency, chainId, hash, originalType }), transactionQueryFn, { staleTime: 0 });

export function useBackendTransaction({ hash, chainId }: BackendTransactionArgs) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const paginatedTransactionsKey = consolidatedTransactionsQueryKey({
    address: accountAddress,
    currency: nativeCurrency,
    chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
  });

  const params: TransactionArgs = {
    hash: hash,
    address: accountAddress,
    currency: nativeCurrency,
    chainId: chainId,
  };

  return useQuery(transactionQueryKey(params), transactionQueryFn, {
    enabled: !!hash && !!accountAddress && !!chainId,
    initialData: () => {
      const queryData = queryClient.getQueryData<PaginatedTransactions>(paginatedTransactionsKey);
      const pages = queryData?.pages;
      if (!pages) return undefined;

      for (const page of pages) {
        const tx = page.transactions.find(tx => tx.hash === hash);
        if (tx) return tx;
      }
      return undefined;
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
