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
jest.mock('@/state/assets/userAssetsStoreManager', () => {
  const { createStore: createZustandStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  const { TEST_PARAMS: params, TEST_WALLET_ADDRESS: address } =
    jest.requireActual<typeof import('../../__fixtures__/ListPositions')>('../../fixtures/ListPositions');
  return {
    userAssetsStoreManager: createZustandStore(() => ({
      address,
      currency: params.currency,
    })),
  };
});

// Import the fetch function
import { fetchPositions, type PositionsParams } from '../../stores/fetcher';

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
});
