import { getPlatformClient } from '@/resources/platform/client';
import { fetchPositions, type PositionsParams } from '../../stores/fetcher';
import { usePositionsStore } from '../../stores/positionsStore';
import type { RainbowPositions } from '../../types';
import { FIXTURE_LIST_POSITIONS_SUCCESS, FIXTURE_PARAMS } from '../../__fixtures__/ListPositions';
import { createMockPositionsData } from '../mocks/positions';

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
  const { FIXTURE_PARAMS: params, FIXTURE_WALLET_ADDRESS: address } =
    jest.requireActual<typeof import('../../__fixtures__/ListPositions')>('../../__fixtures__/ListPositions');
  return {
    userAssetsStoreManager: createZustandStore(() => ({
      address,
      currency: params.currency,
    })),
  };
});

// ============================= HELPERS ===============================

const setStoreData = (data: RainbowPositions) => {
  const store = usePositionsStore.getState();
  store.queryCache[store.queryKey] = {
    data,
    lastFetchedAt: Date.now(),
    cacheTime: 0,
    errorInfo: null,
  };
};

// =============================== TESTS ===============================

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
        data: FIXTURE_LIST_POSITIONS_SUCCESS,
      });

      const params: PositionsParams = FIXTURE_PARAMS;

      const result = await fetchPositions(params, null);

      expect(result).toEqual(FIXTURE_LIST_POSITIONS_SUCCESS);
      expect(result.result?.positions).toHaveLength(60);
    });
  });

  describe('getBalance', () => {
    it('should exclude locked value from wallet balance', () => {
      // total = overallTotal (locked + unlocked)
      // balance = overallTotal - locked = unlocked only
      setStoreData(createMockPositionsData({ totalDeposits: '7000', totalLocked: '3000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('7000');
    });

    it('should return 0 when all positions are locked', () => {
      // If all positions are locked, available balance should be 0
      setStoreData(createMockPositionsData({ totalLocked: '5000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return 0 when locked exceeds total (edge case)', () => {
      // This shouldn't happen, but should floor to 0
      setStoreData(createMockPositionsData({ totalDeposits: '5000', totalBorrows: '10000', totalRewards: '2000', totalLocked: '8000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return full amount when no positions are locked', () => {
      setStoreData(createMockPositionsData({ totalDeposits: '10000', totalLocked: '0' }));
      expect(usePositionsStore.getState().getBalance()).toBe('10000');
    });

    it('should return 0 when total minus locked is negative (credit line scenario)', () => {
      // High borrows with locked collateral
      setStoreData(createMockPositionsData({ totalBorrows: '22881.72', totalLocked: '0' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should handle negative total with locked positions', () => {
      // Negative net position (borrows > deposits) with some locked stakes
      setStoreData(createMockPositionsData({ totalDeposits: '1000', totalBorrows: '3000', totalLocked: '3000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return 0 when both total and locked are 0', () => {
      setStoreData(createMockPositionsData());
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return 0 when no data is available', () => {
      usePositionsStore.getState().queryCache[usePositionsStore.getState().queryKey] = undefined;
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should handle decimal values correctly', () => {
      setStoreData(createMockPositionsData({ totalDeposits: '1000', totalLocked: '234.567890' }));
      expect(usePositionsStore.getState().getBalance()).toBe('1000');
    });

    it('should handle large values correctly', () => {
      setStoreData(createMockPositionsData({ totalDeposits: '750000', totalLocked: '250000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('750000');
    });

    it('should not inflate wallet balance with locked positions', () => {
      // Verify that locked positions don't contribute to wallet balance
      // total = 100k (80k unlocked + 20k locked)
      // balance should be 80k, not 100k
      setStoreData(createMockPositionsData({ totalDeposits: '80000', totalLocked: '20000' }));
      const balance = usePositionsStore.getState().getBalance();
      expect(balance).toBe('80000');
      expect(parseFloat(balance)).toBeLessThan(100000);
    });
  });
});
