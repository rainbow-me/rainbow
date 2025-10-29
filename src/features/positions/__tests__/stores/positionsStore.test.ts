/**
 * Integration tests for positionsStore
 *
 * Tests the integration between fetcher and transform functions
 * Unit tests for individual functions are in fetcher.test.ts and transform.test.ts
 */

import { getPlatformClient } from '@/resources/platform/client';
import { LIST_POSITIONS_SUCCESS, TEST_PARAMS } from '../../__fixtures__/ListPositions';

// Mock dependencies
jest.mock('@/resources/platform/client');
jest.mock('@/config/experimentalHooks', () => ({}));
jest.mock('@/state/backendNetworks/backendNetworks', () => ({
  useBackendNetworksStore: {
    getState: () => ({
      getSupportedPositionsChainIds: () => [1, 10, 137],
    }),
    subscribe: jest.fn(),
  },
}));
jest.mock('@/state/assets/userAssetsStoreManager', () => {
  const { createStore: createZustandStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  const { TEST_PARAMS: params, TEST_WALLET_ADDRESS: address } =
    jest.requireActual<typeof import('../../__fixtures__/ListPositions')>('../../__fixtures__/ListPositions');
  return {
    userAssetsStoreManager: createZustandStore(() => ({
      address,
      currency: params.currency,
    })),
  };
});

// Import the fetch function and store
import { fetchPositions, type PositionsParams } from '../../stores/fetcher';
import { usePositionsStore } from '../../stores/positionsStore';
import type { RainbowPositions, RainbowPosition } from '../../types';

// ============ Helpers ======================================================== //

const field = (amount: string) => ({ amount, display: `$${amount}` });

const createMockData = (
  overrides: {
    total?: string;
    totalLocked?: string;
    totalDeposits?: string;
    totalBorrows?: string;
    totalRewards?: string;
    positions?: RainbowPositions['positions'];
  } = {}
): RainbowPositions => ({
  positions: overrides.positions ?? {},
  totals: {
    total: field(overrides.total ?? '0'),
    totalLocked: field(overrides.totalLocked ?? '0'),
    totalDeposits: field(overrides.totalDeposits ?? '0'),
    totalBorrows: field(overrides.totalBorrows ?? '0'),
    totalRewards: field(overrides.totalRewards ?? '0'),
  },
});

const setStoreData = (data: ReturnType<typeof createMockData>) => {
  const store = usePositionsStore.getState();
  store.queryCache[store.queryKey] = {
    data,
    lastFetchedAt: Date.now(),
    cacheTime: 0,
    errorInfo: null,
  };
};

// ============ Tests ========================================================== //

describe('positionsStore Integration Tests', () => {
  let mockClient: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock client
    mockClient = {
      get: jest.fn(),
    };
    (getPlatformClient as jest.Mock).mockReturnValue(mockClient);
  });

  describe('Integration with Platform API', () => {
    it('should integrate with real fixture response', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: LIST_POSITIONS_SUCCESS,
      });

      const params: PositionsParams = TEST_PARAMS;

      const result = await fetchPositions(params, null);

      expect(result).toEqual(LIST_POSITIONS_SUCCESS);
      expect(result.result?.positions).toHaveLength(60);
    });
  });

  describe('getBalance', () => {
    it('should return 0 when total minus locked is negative (credit line scenario)', () => {
      setStoreData(createMockData({ total: '-22881.72' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return correct balance when total minus locked is positive', () => {
      setStoreData(createMockData({ total: '10000', totalLocked: '5000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('5000');
    });

    it('should return 0 when both total and locked are 0', () => {
      setStoreData(createMockData());
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return 0 when no data is available', () => {
      usePositionsStore.getState().queryCache[usePositionsStore.getState().queryKey] = undefined;
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });
  });
});
