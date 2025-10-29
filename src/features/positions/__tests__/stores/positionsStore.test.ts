import { getPlatformClient } from '@/resources/platform/client';
import { fetchPositions, type PositionsParams } from '../../stores/fetcher';
import { usePositionsStore } from '../../stores/positionsStore';
import type { RainbowPositions } from '../../types';
import { LIST_POSITIONS_SUCCESS, TEST_PARAMS } from '../../__fixtures__/ListPositions';
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
  const { TEST_PARAMS: params, TEST_WALLET_ADDRESS: address } =
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
      setStoreData(createMockPositionsData({ total: '-22881.72' }));
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return correct balance when total minus locked is positive', () => {
      setStoreData(createMockPositionsData({ total: '10000', totalLocked: '5000' }));
      expect(usePositionsStore.getState().getBalance()).toBe('5000');
    });

    it('should return 0 when both total and locked are 0', () => {
      setStoreData(createMockPositionsData());
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });

    it('should return 0 when no data is available', () => {
      usePositionsStore.getState().queryCache[usePositionsStore.getState().queryKey] = undefined;
      expect(usePositionsStore.getState().getBalance()).toBe('0');
    });
  });
});
