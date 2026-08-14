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
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { queryClient } from '@/react-query';
import { fetchRawTransaction } from '@/resources/transactions/transaction';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { pendingTransactionsActions, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { RelayExecutionStatus, type RelayExecutionId, type RelayStatusSnapshot } from '@rainbow-me/sdk';
import { SwapType } from '@rainbow-me/swaps';

import { resolveTrackedTransaction } from './pendingTransactionResolution';
import { useWatchPendingTransactions, watchPendingTransaction } from './useWatchPendingTxs';

const EXECUTION_ID: RelayExecutionId = '0x0101010101010101010101010101010101010101010101010101010101010101';
const OTHER_EXECUTION_ID: RelayExecutionId = '0x0202020202020202020202020202020202020202020202020202020202020202';
const SETTLED_EXECUTION_ID: RelayExecutionId = '0x0303030303030303030303030303030303030303030303030303030303030303';

jest.mock('@rainbow-me/sdk', () => ({
  RelayExecutionStatus: {
    AwaitingWallet: 'AWAITING_WALLET',
    Confirmed: 'CONFIRMED',
    Failed: 'FAILED',
    Pending: 'PENDING',
    Prepared: 'PREPARED',
    Reverted: 'REVERTED',
    Submitting: 'SUBMITTING',
  },
}));

jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  useCallback: (callback: unknown) => callback,
  useRef: (initialValue: unknown) => ({ current: initialValue }),
}));

jest.mock('./pendingTransactionResolution', () => ({
  resolveTrackedTransaction: jest.fn(),
}));

jest.mock('@/resources/transactions/transaction', () => ({
  fetchRawTransaction: jest.fn(),
}));

jest.mock('@/features/config/hooks/experimentalHooks', () => ({}));
jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: jest.fn(() => false),
}));

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

jest.mock('@/state/assets/userAssetsStoreManager', () => {
  const cachedStore = { getState: () => ({ userAssets: new Map() }) };
  const state = { address: '0x123', cachedStore, currency: 'ETH' as const };

  return {
    userAssetsStoreManager: Object.assign((selector: (storeState: typeof state) => unknown) => selector(state), {
      getState: () => state,
      setState: (nextState: Partial<typeof state>) => Object.assign(state, nextState),
      subscribe: jest.fn(),
    }),
  };
});

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

jest.mock('@/features/network/stores/backendNetworksStore', () => {
  const chainIds = [1, 10, 8453];
  const state = {
    getSupportedChainIds: () => chainIds,
    getSupportedMainnetChainIds: () => chainIds,
    getSupportedPositionsChainIds: () => chainIds,
  };

  return {
    backendNetworksActions: state,
    useBackendNetworksStore: { getState: () => state, subscribe: () => () => undefined },
  };
});

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

describe('watchPendingTransaction', () => {
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

  it('polls caller-supplied transactions one at a time in round-robin order', async () => {
    const firstTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const secondTransaction = buildManagedPendingTransaction({ hash: 'execution-2', relayExecutionId: 'execution-2' });
    const watch = useWatchPendingTransactions({ address: TEST_ADDRESS });

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [secondTransaction, firstTransaction],
    });
    mockResolveTrackedTransaction
      .mockResolvedValueOnce({ kind: 'pending', transaction: firstTransaction })
      .mockResolvedValueOnce({ kind: 'pending', transaction: secondTransaction });

    await watch([firstTransaction, secondTransaction], new AbortController());
    await watch([firstTransaction, secondTransaction], new AbortController());

    expect(mockResolveTrackedTransaction).toHaveBeenCalledTimes(2);
    expect(mockResolveTrackedTransaction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        transaction: firstTransaction,
      })
    );
    expect(mockResolveTrackedTransaction).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        transaction: secondTransaction,
      })
    );
  });

  it('keeps unsettled overlays and retains newly settled overlays until history indexes them', async () => {
    const stillPendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
    const confirmedPendingTransaction = buildManagedPendingTransaction({
      hash: OTHER_EXECUTION_ID,
      relayExecutionId: OTHER_EXECUTION_ID,
    });
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
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      transaction: confirmedTransaction,
    });

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: confirmedPendingTransaction,
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

  it('preserves transactions added while a poll is in flight', async () => {
    const firstTransaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const secondTransaction = buildManagedPendingTransaction({ hash: 'execution-2', relayExecutionId: 'execution-2' });
    const confirmedTransaction: SettledTransaction = {
      ...firstTransaction,
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };
    const resolution = createDeferred<Awaited<ReturnType<typeof resolveTrackedTransaction>>>();

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [firstTransaction],
    });
    mockResolveTrackedTransaction.mockImplementation(() => resolution.promise);

    const watchPromise = watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: firstTransaction,
    });

    pendingTransactionsActions.addPendingTransaction({
      address: TEST_ADDRESS,
      pendingTransaction: secondTransaction,
    });
    resolution.resolve({ kind: 'settled', transaction: confirmedTransaction });
    await watchPromise;

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([confirmedTransaction, secondTransaction]);
  });

  it('ignores a stale result after the polled transaction is replaced', async () => {
    const transaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const replacement: PendingTransaction = {
      ...transaction,
      description: 'newer local state',
    };
    const confirmedTransaction: SettledTransaction = {
      ...transaction,
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };
    const resolution = createDeferred<Awaited<ReturnType<typeof resolveTrackedTransaction>>>();

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [transaction],
    });
    mockResolveTrackedTransaction.mockImplementation(() => resolution.promise);

    const watchPromise = watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction,
    });

    pendingTransactionsActions.addPendingTransaction({
      address: TEST_ADDRESS,
      pendingTransaction: replacement,
    });
    resolution.resolve({ kind: 'settled', transaction: confirmedTransaction });
    await watchPromise;

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([replacement]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)).toHaveLength(1);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toBe(replacement);
  });

  it('leaves overlays unchanged when resolution fails', async () => {
    const transaction = buildManagedPendingTransaction({ hash: 'execution-1', relayExecutionId: 'execution-1' });
    const error = new Error('rate limited');

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [transaction],
    });
    mockResolveTrackedTransaction.mockRejectedValue(error);

    await expect(
      watchPendingTransaction({
        abortController: new AbortController(),
        address: TEST_ADDRESS,
        currency: TEST_CURRENCY,
        transaction,
      })
    ).rejects.toBe(error);

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([transaction]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)).toHaveLength(0);
  });

  it('drops settled overlays once history includes them', async () => {
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
    const settledTransaction: SettledTransaction = {
      ...pendingTransaction,
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [pendingTransaction],
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

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
    });
    await flushBackgroundSync();

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([]);
  });

  it('keeps existing settled overlays visible while only pending transactions are watched', async () => {
    const settledOverlay = buildManagedConfirmedTransaction({
      hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      relayExecutionId: SETTLED_EXECUTION_ID,
    });
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [settledOverlay, pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'pending',
      transaction: pendingTransaction,
    });

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
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
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
    const settledTransaction: SettledTransaction = {
      ...pendingTransaction,
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
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
    const relayStatus: RelayStatusSnapshot = {
      status: RelayExecutionStatus.Confirmed,
      updatedAtMs: 0,
      onchain: {
        scope: 'crosschain',
        observed: 'both',
        origin: {
          chainId: 8453,
          hashes: ['0x1111111111111111111111111111111111111111111111111111111111111111'],
          kind: 'evm',
        },
        destination: {
          chainId: 10,
          hashes: ['0x2222222222222222222222222222222222222222222222222222222222222222'],
          kind: 'evm',
        },
      },
    };

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      relayStatus,
      transaction: settledTransaction,
    });

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
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
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
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

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
    });

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)).toHaveLength(1);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(failedTransaction);
    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBeUndefined();
    expect(refetchQueriesSpy).not.toHaveBeenCalled();
  });

  it('updates the local overlay before managed history sync finishes', async () => {
    const originHash: `0x${string}` = '0x1111111111111111111111111111111111111111111111111111111111111111';
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
    const confirmedTransaction: SettledTransaction = {
      ...pendingTransaction,
      hash: originHash,
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };
    const relayFetch = createDeferred<RainbowTransaction | null>();

    pendingTransactionsActions.setPendingTransactions({
      address: TEST_ADDRESS,
      pendingTransactions: [pendingTransaction],
    });
    mockResolveTrackedTransaction.mockResolvedValue({
      kind: 'settled',
      relayStatus: {
        status: RelayExecutionStatus.Confirmed,
        updatedAtMs: 0,
        onchain: {
          scope: 'singlechain',
          transactions: {
            chainId: 8453,
            hashes: [originHash],
            kind: 'evm',
          },
        },
      },
      transaction: confirmedTransaction,
    });
    mockFetchRawTransaction.mockImplementation(() => relayFetch.promise);

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
    });

    expect(usePendingTransactionsStore.getState().pendingTransactions[TEST_ADDRESS]).toEqual([confirmedTransaction]);
    expect(Object.values(useRainbowToastsStore.getState().toasts)[0]?.transaction).toEqual(confirmedTransaction);
    expect(refetchQueriesSpy).not.toHaveBeenCalled();

    relayFetch.resolve(null);
    await flushBackgroundSync();

    expect(refetchQueriesSpy).toHaveBeenCalledTimes(1);
  });

  it('drops a confirmed managed overlay immediately when relay provides no onchain hash', async () => {
    const pendingTransaction = buildManagedPendingTransaction({ hash: EXECUTION_ID, relayExecutionId: EXECUTION_ID });
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

    await watchPendingTransaction({
      abortController: new AbortController(),
      address: TEST_ADDRESS,
      currency: TEST_CURRENCY,
      transaction: pendingTransaction,
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

function buildManagedPendingTransaction({
  hash,
  relayExecutionId,
}: {
  hash: string;
  relayExecutionId: RelayExecutionId;
}): PendingTransaction {
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
  relayExecutionId: RelayExecutionId;
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
