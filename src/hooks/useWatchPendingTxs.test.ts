import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Address } from 'viem';

import { useRainbowToastsStore } from '@/components/rainbow-toast/useRainbowToastsStore';
import type { ParsedAddressAsset } from '@/entities/tokens';
import {
  TransactionDirection,
  TransactionStatus,
  type PendingTransaction,
  type RainbowTransaction,
  type SettledTransaction,
} from '@/entities/transactions';
import { queryClient } from '@/react-query';
import { fetchRawTransaction } from '@/resources/transactions/transaction';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { pendingTransactionsActions, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { RelayExecutionStatus } from '@rainbow-me/delegation';
import { SwapType } from '@rainbow-me/swaps';

import { resolveTrackedTransaction } from './pendingTransactionResolution';
import { watchPendingTransactions } from './useWatchPendingTxs';

jest.mock('./pendingTransactionResolution', () => ({
  resolveTrackedTransaction: jest.fn(),
}));

jest.mock('@/resources/transactions/transaction', () => ({
  fetchRawTransaction: jest.fn(),
}));

jest.mock('@/config/experimentalHooks', () => ({}));

jest.mock('@/redux/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      settings: {
        nativeCurrency: 'ETH',
      },
    }),
  },
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  useSwapsStore: {
    getState: () => ({
      preferredNetwork: undefined,
    }),
  },
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  getAccountAddress: () => '0x123',
  useAccountAddress: () => '0x123',
  useWalletsStore: {
    getState: () => ({
      accountAddress: '0x123',
    }),
    subscribe: jest.fn(),
  },
}));

jest.mock('@/parsers/transactions', () => ({
  convertNewTransactionToRainbowTransaction: jest.fn(),
}));

jest.mock('@/state/nonces', () => ({
  nonceActions: {
    getNonce: jest.fn(),
    setNonce: jest.fn(),
  },
}));

jest.mock('@/resources/transactions/consolidatedTransactions', () => ({
  consolidatedTransactionsQueryKey: (params: unknown) => ['consolidatedTransactions', params],
}));

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
  },
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

const TEST_ADDRESS: Address = '0x123';
const TEST_CURRENCY = 'ETH';

type ConfirmedManagedTransaction = Omit<PendingTransaction, 'status' | 'title'> & {
  status: TransactionStatus.confirmed;
  title: 'swap.confirmed';
};

describe('watchPendingTransactions', () => {
  const mockResolveTrackedTransaction = jest.mocked(resolveTrackedTransaction);
  const mockFetchRawTransaction = jest.mocked(fetchRawTransaction);
  let refetchQueriesSpy: jest.SpiedFunction<typeof queryClient.refetchQueries>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    queryClient.clear();
    resetStores();

    refetchQueriesSpy = jest.spyOn(queryClient, 'refetchQueries').mockImplementation(async () => undefined);
  });

  afterEach(() => {
    refetchQueriesSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('keeps unsettled overlays and retains newly settled overlays until history indexes them', async () => {
    const stillPendingTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const confirmedPendingTransaction = buildManagedPendingTransaction({ hash: 'execution-2', relayExecutionId: 'execution-2' });
    const confirmedTransaction: SettledTransaction = {
      ...confirmedPendingTransaction,
      changes: [
        {
          asset: buildChangedAsset({
            address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            chainId: 8453,
            name: 'Token A',
            symbol: 'TKNA',
          }),
          direction: TransactionDirection.OUT,
        },
        {
          asset: buildChangedAsset({
            address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            chainId: 8453,
            name: 'Token B',
            symbol: 'TKNB',
          }),
          direction: TransactionDirection.IN,
        },
      ],
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [stillPendingTransaction, confirmedPendingTransaction],
    });
    mockResolveTrackedTransaction
      .mockResolvedValueOnce({
        kind: 'pending',
        transaction: stillPendingTransaction,
      })
      .mockResolvedValueOnce({
        kind: 'settled',
        transaction: confirmedTransaction,
      });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [stillPendingTransaction, confirmedPendingTransaction],
    });
    await flushBackgroundSync();

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([
      stillPendingTransaction,
      confirmedTransaction,
    ]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)).toHaveLength(1);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(confirmedTransaction);
    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toEqual([
      expect.objectContaining({
        transaction: expect.objectContaining({
          chainId: 8453,
          changes: confirmedTransaction.changes,
          hash: confirmedTransaction.hash,
          type: 'swap',
        }),
      }),
    ]);
    expect(refetchQueriesSpy).toHaveBeenCalledWith({
      queryKey: [
        'consolidatedTransactions',
        {
          address: TEST_ADDRESS,
          chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
          currency: TEST_CURRENCY,
        },
      ],
      type: 'all',
    });
  });

  it('drops settled overlays once history includes them', async () => {
    const settledTransaction: SettledTransaction = {
      ...buildManagedPendingTransaction({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
      }),
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      transaction: settledTransaction,
    });
    refetchQueriesSpy.mockImplementation(async () => {
      queryClient.setQueryData(
        [
          'consolidatedTransactions',
          {
            address: TEST_ADDRESS,
            chainIds: backendNetworksActions.getSupportedMainnetChainIds(),
            currency: TEST_CURRENCY,
          },
        ],
        {
          pages: [
            {
              transactions: [settledTransaction],
            },
          ],
        }
      );
    });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });
    await flushBackgroundSync();

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([]);
  });

  it('keeps existing settled overlays visible while only pending transactions are watched', async () => {
    const settledOverlay = buildManagedConfirmedTransaction({
      hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      relayExecutionId: 'execution-settled',
    });
    const pendingTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [settledOverlay, pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'pending',
      transaction: pendingTransaction,
    });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [pendingTransaction],
    });

    expect(mockResolveTrackedTransaction).toHaveBeenCalledTimes(1);
    expect(mockResolveTrackedTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        address: TEST_ADDRESS,
        currency: TEST_CURRENCY,
        transaction: pendingTransaction,
      })
    );
    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([settledOverlay, pendingTransaction]);
  });

  it('syncs managed destination history after a confirmed transition', async () => {
    const settledTransaction: SettledTransaction = {
      ...buildManagedPendingTransaction({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
        relayExecutionId: 'execution-1',
      }),
      changes: [
        {
          asset: buildChangedAsset({
            address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            chainId: 8453,
            name: 'Token A',
            symbol: 'TKNA',
          }),
          direction: TransactionDirection.OUT,
        },
        {
          asset: buildChangedAsset({
            address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            chainId: 10,
            name: 'Token B',
            symbol: 'TKNB',
          }),
          direction: TransactionDirection.IN,
        },
      ],
      swap: {
        fromChainId: 8453,
        isBridge: false,
        toChainId: 10,
        type: SwapType.crossChain,
      },
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };
    const relayStatus = {
      status: RelayExecutionStatus.Confirmed,
      updatedAtMs: 0,
      onchain: {
        type: 'crosschain' as const,
        origin: {
          chainId: 8453,
          txHashes: ['0x1111111111111111111111111111111111111111111111111111111111111111' as const],
        },
        destination: {
          chainId: 10,
          txHashes: ['0x2222222222222222222222222222222222222222222222222222222222222222' as const],
        },
      },
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      relayStatus,
      transaction: settledTransaction,
    });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });
    await flushBackgroundSync();

    expect(mockFetchRawTransaction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: TEST_ADDRESS,
        chainId: 8453,
        currency: TEST_CURRENCY,
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      })
    );
    expect(mockFetchRawTransaction).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        address: TEST_ADDRESS,
        chainId: 10,
        currency: TEST_CURRENCY,
        hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
      })
    );
  });

  it('does not queue balance watching for failed transactions', async () => {
    const pendingTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const failedTransaction: SettledTransaction = {
      ...pendingTransaction,
      status: TransactionStatus.failed,
      title: 'swap.failed',
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      transaction: failedTransaction,
    });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [pendingTransaction],
    });

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)).toHaveLength(1);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(failedTransaction);
    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBeUndefined();
    expect(refetchQueriesSpy).not.toHaveBeenCalled();
  });

  it('updates the local overlay before managed history sync finishes', async () => {
    const originHash: `0x${string}` = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const confirmedTransaction: SettledTransaction = {
      ...buildManagedPendingTransaction({ hash: originHash, relayExecutionId: 'execution-1' }),
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };
    const relayFetch = createDeferred<RainbowTransaction | null>();

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      relayStatus: {
        status: RelayExecutionStatus.Confirmed,
        updatedAtMs: 0,
        onchain: {
          type: 'singlechain',
          origin: {
            chainId: 8453,
            txHashes: [originHash],
          },
        },
      },
      transaction: confirmedTransaction,
    });
    mockFetchRawTransaction.mockImplementation(() => relayFetch.promise);

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' })],
    });

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([confirmedTransaction]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(confirmedTransaction);
    expect(refetchQueriesSpy).not.toHaveBeenCalled();

    relayFetch.resolve(null);
    await flushBackgroundSync();

    expect(refetchQueriesSpy).toHaveBeenCalledTimes(1);
  });

  it('drops a confirmed managed overlay immediately when relay provides no onchain hash', async () => {
    const pendingTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const confirmedTransaction: SettledTransaction = {
      ...pendingTransaction,
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      relayStatus: {
        status: RelayExecutionStatus.Confirmed,
        updatedAtMs: 0,
      },
      transaction: confirmedTransaction,
    });

    await watchPendingTransactions({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transactions: [pendingTransaction],
    });
    await flushBackgroundSync();

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(confirmedTransaction);
    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toEqual([
      expect.objectContaining({
        transaction: expect.objectContaining({
          hash: confirmedTransaction.hash,
          type: confirmedTransaction.type,
        }),
      }),
    ]);
    expect(mockFetchRawTransaction).not.toHaveBeenCalled();
    expect(refetchQueriesSpy).not.toHaveBeenCalled();
  });
});

function resetStores() {
  pendingTransactionsActions.clearPendingTransactions();
  useAssetUpdatesStore.setState({ watchedTransactions: {} });
  useRainbowToastsStore.setState({
    isShowingTransactionDetails: false,
    pendingRemoveToastIds: [],
    showExpanded: false,
    toasts: {},
  });
}

function buildManagedPendingTransaction({ hash, relayExecutionId }: { hash: string; relayExecutionId: string }): PendingTransaction {
  return {
    asset: null,
    chainId: 8453,
    from: null,
    hash,
    network: 'Base',
    nonce: 7,
    relayExecutionId,
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: null,
    type: 'swap',
  };
}

function buildManagedConfirmedTransaction({
  hash,
  relayExecutionId,
}: {
  hash: string;
  relayExecutionId: string;
}): ConfirmedManagedTransaction {
  return {
    ...buildManagedPendingTransaction({ hash, relayExecutionId }),
    status: TransactionStatus.confirmed,
    title: 'swap.confirmed',
  };
}

function buildChangedAsset({
  address,
  chainId,
  name,
  symbol,
}: {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
}): ParsedAddressAsset {
  return {
    address,
    chainId,
    decimals: 18,
    name,
    network: 'Base',
    symbol,
    uniqueId: `${address}_${chainId}`,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
}

async function flushBackgroundSync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
