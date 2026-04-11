import { TransactionDirection } from '@/entities/transactions';

import { useWatchAssetUpdateTransactions } from './useWatchMinedTransactions';

const mockTrack = jest.fn();
const mockWarn = jest.fn();
const mockError = jest.fn();
const mockGetAssetUpdates = jest.fn();
const mockSetUserAssets = jest.fn();
const mockClearWatchedTransactions = jest.fn();
const mockClearExpiredData = jest.fn();
const mockPositionsFetch = jest.fn();
const mockGetTokenAddresses = jest.fn();
const mockClaimablesFetch = jest.fn();
const mockRewardsFetch = jest.fn();
const mockInvalidateAddressNftsQueries = jest.fn();

let mockCurrentUserAssets = new Map();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

jest.mock('@/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockError(...args),
    warn: (...args: unknown[]) => mockWarn(...args),
  },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/analytics', () => ({
  analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock('@/resources/platform/client', () => ({
  getPlatformClient: () => ({
    get: (...args: unknown[]) => mockGetAssetUpdates(...args),
  }),
}));

jest.mock('@/resources/nfts', () => ({
  invalidateAddressNftsQueries: (...args: unknown[]) => mockInvalidateAddressNftsQueries(...args),
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

jest.mock('@/state/assets/userAssets', () => ({
  userAssetsStore: {
    getState: () => ({
      userAssets: mockCurrentUserAssets,
    }),
    setState: (updater: (state: object) => unknown) => updater({}),
  },
}));

jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: (selector: (state: { currency: string }) => unknown) => selector({ currency: 'ETH' }),
}));

jest.mock('@/state/assets/utils', () => ({
  filterZeroBalanceAssets: (assets: unknown[]) => assets,
  setUserAssets: (...args: unknown[]) => mockSetUserAssets(...args),
}));

jest.mock('@/state/minedTransactions/minedTransactions', () => ({
  useAssetUpdatesStore: {
    getState: () => ({
      clearWatchedTransactions: (...args: unknown[]) => mockClearWatchedTransactions(...args),
    }),
  },
}));

jest.mock('@/state/staleBalances', () => ({
  staleBalancesStore: Object.assign(
    (selector: (state: { staleBalances: Record<string, undefined> }) => unknown) => selector({ staleBalances: { '0x123': undefined } }),
    {
      getState: () => ({
        clearExpiredData: (...args: unknown[]) => mockClearExpiredData(...args),
      }),
    }
  ),
}));

jest.mock('@/features/positions/stores/positionsStore', () => ({
  usePositionsStore: {
    getState: () => ({
      fetch: (...args: unknown[]) => mockPositionsFetch(...args),
      getTokenAddresses: (...args: unknown[]) => mockGetTokenAddresses(...args),
    }),
  },
}));

jest.mock('@/state/claimables/claimables', () => ({
  useClaimablesStore: {
    getState: () => ({
      fetch: (...args: unknown[]) => mockClaimablesFetch(...args),
    }),
  },
}));

jest.mock('@/features/rnbw-rewards/stores/rewardsBalanceStore', () => ({
  useRewardsBalanceStore: {
    getState: () => ({
      fetch: (...args: unknown[]) => mockRewardsFetch(...args),
    }),
  },
}));

describe('useWatchAssetUpdateTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUserAssets = new Map([
      [
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_8453',
        {
          balance: { amount: '0' },
          decimals: 18,
        },
      ],
      [
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb_10',
        {
          balance: { amount: '0' },
          decimals: 18,
        },
      ],
    ]);

    mockSetUserAssets.mockImplementation(({ state }: { state: object }) => state);
    mockGetTokenAddresses.mockReturnValue(new Set());
    mockGetAssetUpdates.mockResolvedValue({
      data: {
        result: {
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:8453': {
            quantity: '1',
            value: '1',
          },
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:10': {
            quantity: '1',
            value: '1',
          },
        },
      },
    });
    mockPositionsFetch.mockResolvedValue(undefined);
    mockClaimablesFetch.mockResolvedValue(undefined);
    mockRewardsFetch.mockResolvedValue(undefined);
    mockInvalidateAddressNftsQueries.mockResolvedValue(undefined);
  });

  it('watches every chain touched by a cross-chain transaction', async () => {
    const watchAssetUpdateTransactions = useWatchAssetUpdateTransactions({ address: '0x123' });

    await watchAssetUpdateTransactions([
      {
        pollingStartedAt: Date.now(),
        transaction: {
          asset: null,
          chainId: 8453,
          changes: [
            {
              asset: {
                address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                chainId: 8453,
                decimals: 18,
                name: 'Token A',
                network: 'Base',
                symbol: 'TKNA',
                uniqueId: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_8453',
              },
              direction: TransactionDirection.OUT,
            },
            {
              asset: {
                address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
                chainId: 10,
                decimals: 18,
                name: 'Token B',
                network: 'Optimism',
                symbol: 'TKNB',
                uniqueId: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb_10',
              },
              direction: TransactionDirection.IN,
            },
          ],
          hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          minedAt: undefined,
          type: 'swap',
        },
      },
    ]);

    expect(mockGetAssetUpdates).toHaveBeenCalledWith(
      '/assets/GetAssetUpdates',
      expect.objectContaining({
        params: expect.objectContaining({
          address: '0x123',
          chainIds: '8453,10',
          currency: 'ETH',
          forcedTokens: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:8453,0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:10',
        }),
      })
    );
    expect(mockSetUserAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        chainIdsToUpdate: [8453, 10],
      })
    );
  });
});
