import { Platform } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http, isHash, type PublicClient } from 'viem';
import { foundry } from 'viem/chains';

import { TransactionStatus, type MinedTransaction, type RainbowTransaction, type TransactionType } from '@/entities/transactions';
import { IS_TEST } from '@/env';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { type GetTransactionByHashResponse } from '@/features/positions/types/generated/transaction/transaction';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { ensureError, logger, RainbowError } from '@/logger';
import { parseTransaction } from '@/parsers/transactions';
import { createQueryKey, queryClient, type QueryFunctionArgs, type QueryFunctionResult } from '@/react-query';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { consolidatedTransactionsQueryKey, type consolidatedTransactionsQueryFunction } from './consolidatedTransactions';

export const e2eAnvilConfirmedTransactions: RainbowTransaction[] = [];

// Anvil uses a different RPC URL for Android emulators
const ANVIL_RPC_URL = IS_TEST && Platform.OS === 'android' ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';

export const anvilChain = {
  ...foundry,
  id: 1337,
  name: 'Ethereum',
  network: 'ethereum',
  rpcUrls: {
    public: { http: [ANVIL_RPC_URL] },
    default: { http: [ANVIL_RPC_URL] },
  },
} as const;

let localPublicClient: PublicClient | null = null;
if (IS_TEST) {
  localPublicClient = createPublicClient({
    chain: anvilChain,
    transport: http(ANVIL_RPC_URL),
  });
}

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

// 4xx responses where the client cannot meaningfully react. Silenced so the pending-tx
// watcher's 1Hz polling doesn't flood Sentry while a persistent server-side condition
// (auth, WAF, rate limit, not-yet-indexed) clears. 400 / 422 and other client-bug codes
// are deliberately omitted: those signal malformed requests we want to see.
const SILENCED_FETCH_STATUSES = new Set([401, 403, 404, 408, 429]);

export const fetchRawTransaction = async ({
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
}): Promise<RainbowTransaction | null> => {
  if (IS_TEST && localPublicClient && chainId === anvilChain.id) {
    try {
      if (!isHash(hash)) throw new Error('Invalid transaction hash');

      const receipt = await localPublicClient.getTransactionReceipt({ hash });
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
        if (!e2eAnvilConfirmedTransactions.find(tx => tx.hash === minedTx.hash)) {
          e2eAnvilConfirmedTransactions.unshift(minedTx);
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
    if (e instanceof RainbowFetchError && e.response && SILENCED_FETCH_STATUSES.has(e.response.status)) {
      return null;
    }
    logger.error(new RainbowError('[transaction]: Failed to fetch transaction', e));
    return null;
  }
};

// ///////////////////////////////////////////////
// Query Function

export const transactionQueryKey = ({ hash, address, currency, chainId, originalType }: TransactionArgs) =>
  createQueryKey('transactions', { address, currency, chainId, hash, originalType }, { persisterVersion: 1 });

export function transactionQueryFn({
  queryKey: [{ address, currency, chainId, hash, originalType }],
}: QueryFunctionArgs<typeof transactionQueryKey>): Promise<RainbowTransaction | null> {
  return fetchRawTransaction({ address, currency, chainId, hash, originalType });
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
