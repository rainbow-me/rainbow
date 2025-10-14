import { NativeCurrencyKey, TransactionStatus, MinedTransaction, RainbowTransaction, TransactionType } from '@/entities';
import { createQueryKey, queryClient, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { consolidatedTransactionsQueryFunction, consolidatedTransactionsQueryKey } from './consolidatedTransactions';
import { parseTransaction } from '@/parsers/transactions';
import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { createPublicClient, http, Hash, PublicClient, TransactionReceipt } from 'viem';
import { foundry } from 'viem/chains';
import { Platform } from 'react-native';
import { IS_TEST } from '@/env';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { GetTransactionByHashResponse } from '@/features/positions/types/generated/transaction/transaction';
import { getPlatformClient } from '@/resources/platform/client';

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
      const client = localPublicClient as PublicClient;
      const receipt: TransactionReceipt = await client.getTransactionReceipt({
        hash: hash as Hash,
      });

      if (!receipt) {
        return null;
      }

      const status = receipt.status === 'success' ? TransactionStatus.confirmed : TransactionStatus.failed;

      // Use originalType if available, otherwise fallback to a generic type for title construction
      const transactionTypeForTitle = originalType || 'contract_interaction';

      let titleKey: string;
      if (status === TransactionStatus.confirmed) {
        titleKey = `${transactionTypeForTitle}.confirmed`;
      } else if (status === TransactionStatus.failed) {
        titleKey = `${transactionTypeForTitle}.failed`;
      } else {
        titleKey = transactionTypeForTitle;
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
        type: (originalType || 'contract_interaction') as TransactionType,
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
        message: (e as Error)?.message,
        hash,
      });
      return null;
    }
  }
  try {
    console.log({
      currency: currency.toLowerCase(),
      hash,
      address,
      chainIds: String(chainId),
    });
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
    // const transaction = normalizeTransactionResponse(response).data.payload.transaction;
    const parsed = parseTransaction(response.data.result, currency, chainId);
    if (!parsed) throw new Error('Failed to parse transaction');

    return parsed;
  } catch (e) {
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
    chainIds: useBackendNetworksStore.getState().getSupportedMainnetChainIds(),
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
