import { TransactionDirection, TransactionStatus } from '@/entities/transactions';

import { useWatchPendingTransactions } from './useWatchPendingTxs';

const mockResolvePendingTransaction = jest.fn();
const mockSetPendingTransactions = jest.fn();
const mockHandleTransaction = jest.fn();
const mockAddWatchedTransactions = jest.fn();
const mockRefetchQueries = jest.fn();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

jest.mock('@/resources/transactions/consolidatedTransactions', () => ({
  consolidatedTransactionsQueryKey: (params: unknown) => ['consolidatedTransactions', params],
}));

jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: (selector: (state: { currency: string }) => unknown) => selector({ currency: 'ETH' }),
}));

jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  backendNetworksActions: {
    getSupportedMainnetChainIds: () => [1, 8453],
  },
}));

jest.mock('@/state/pendingTransactions', () => ({
  pendingTransactionsActions: {
    setPendingTransactions: (...args: unknown[]) => mockSetPendingTransactions(...args),
  },
}));

jest.mock('@/components/rainbow-toast/useRainbowToastsStore', () => ({
  useRainbowToastsStore: {
    getState: () => ({
      handleTransaction: (...args: unknown[]) => mockHandleTransaction(...args),
    }),
  },
}));

jest.mock('@/react-query', () => ({
  queryClient: {
    refetchQueries: (...args: unknown[]) => mockRefetchQueries(...args),
  },
}));

jest.mock('./pendingTransactionResolution', () => ({
  resolvePendingTransaction: (...args: unknown[]) => mockResolvePendingTransaction(...args),
}));

jest.mock('@/state/minedTransactions/minedTransactions', () => {
  const actual = jest.requireActual('@/state/minedTransactions/minedTransactions');
  return {
    ...actual,
    useAssetUpdatesStore: {
      getState: () => ({
        addWatchedTransactions: (...args: unknown[]) => mockAddWatchedTransactions(...args),
      }),
    },
  };
});

describe('useWatchPendingTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetchQueries.mockResolvedValue(undefined);
  });

  it('routes relay-confirmed managed swaps into targeted asset update polling', async () => {
    const confirmedTransaction = {
      ...buildManagedPendingTransaction(),
      changes: [
        {
          asset: {
            address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            chainId: 8453,
          },
          direction: TransactionDirection.OUT,
        },
        {
          asset: {
            address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            chainId: 8453,
          },
          direction: TransactionDirection.IN,
        },
      ],
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      status: TransactionStatus.confirmed,
      title: 'swap.confirmed',
    };

    mockResolvePendingTransaction.mockResolvedValue({
      kind: 'settled',
      transaction: confirmedTransaction,
    });

    const watchPendingTransactions = useWatchPendingTransactions({ address: '0x123' });
    await watchPendingTransactions([buildManagedPendingTransaction()], new AbortController());

    expect(mockSetPendingTransactions).toHaveBeenCalledWith({
      address: '0x123',
      pendingTransactions: [],
    });
    expect(mockHandleTransaction).toHaveBeenCalledWith(confirmedTransaction);
    expect(mockAddWatchedTransactions).toHaveBeenCalledWith({
      address: '0x123',
      transactions: [
        expect.objectContaining({
          chainId: 8453,
          changes: confirmedTransaction.changes,
          hash: confirmedTransaction.hash,
          minedAt: undefined,
          type: 'swap',
        }),
      ],
    });
    expect(mockRefetchQueries).toHaveBeenCalledWith({
      queryKey: [
        'consolidatedTransactions',
        {
          address: '0x123',
          chainIds: [1, 8453],
          currency: 'ETH',
        },
      ],
      type: 'all',
    });
  });
});

function buildManagedPendingTransaction() {
  return {
    asset: null,
    chainId: 8453,
    from: null,
    hash: 'execution-1',
    network: 'Base',
    nonce: 7,
    relayExecutionId: 'execution-1',
    status: TransactionStatus.pending,
    title: 'swap.pending',
    to: null,
    type: 'swap' as const,
  };
}
