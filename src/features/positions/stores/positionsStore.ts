import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import type { RainbowPositions, ListPositionsResponse, RainbowPosition, RainbowDeposit, RainbowPool, RainbowStake } from '../types';
import { fetchPositions, type PositionsParams } from './fetcher';
import { transformPositions } from './transform';

// ============ Constants ====================================================== //

import {
  MIN_POSITION_VALUE_USD,
  HYPERLIQUID_PROTOCOL,
  CONCENTRATED_LIQUIDITY_PROTOCOLS,
  EMPTY_POSITIONS,
  CACHE_TIME,
  STALE_TIME,
} from '../constants';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

// ============ Core Types ===================================================== //

type PositionsState = {
  getPosition: (uniqueId: string) => RainbowPosition | undefined;
  getPositionTokenAddresses: () => Set<string>;
};

// ============ Positions Store ================================================ //

export const usePositionsStore = createQueryStore<ListPositionsResponse, PositionsParams, PositionsState, RainbowPositions>(
  {
    fetcher: fetchPositions,
    transform: transformPositions,
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
      chainIds: $ => $(useBackendNetworksStore, s => s.getSupportedPositionsChainIds()),
    },
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
  },
  (_: unknown, get) => ({
    getPosition: (uniqueId: string) => {
      return get().getData()?.positions[uniqueId];
    },

    getPositionTokenAddresses: () => {
      const positionTokenAddresses = new Set<string>();
      const data = get().getData() as RainbowPositions;

      if (data?.positions) {
        Object.values(data.positions).forEach((position: RainbowPosition) => {
          position.deposits?.forEach((deposit: RainbowDeposit) => {
            if (deposit.pool_address) {
              positionTokenAddresses.add(deposit.pool_address.toLowerCase());
            }
          });
          position.pools?.forEach((pool: RainbowPool) => {
            if (pool.pool_address) {
              positionTokenAddresses.add(pool.pool_address.toLowerCase());
            }
          });
          position.stakes?.forEach((stake: RainbowStake) => {
            if (stake.pool_address) {
              positionTokenAddresses.add(stake.pool_address.toLowerCase());
            }
          });
        });
      }

      return positionTokenAddresses;
    },
  })
);

// ============ Store Actions ================================================== //

export const positionsActions = createStoreActions(usePositionsStore);

// ============ Public Exports ================================================= //

// Export constants for use in parsers
export { MIN_POSITION_VALUE_USD, HYPERLIQUID_PROTOCOL, CONCENTRATED_LIQUIDITY_PROTOCOLS, EMPTY_POSITIONS };

// Store aliases for backward compatibility
export const useDefiPositionsStore = usePositionsStore;
export const refreshPositions = positionsActions.fetch;
export const clearPositions = positionsActions.reset;

// Selectors
export const selectPositions = () => usePositionsStore.getState().getData();
export const selectIsLoading = () => usePositionsStore.getState().status === 'loading';
export const selectError = () => usePositionsStore.getState().error;
export const selectPositionTotals = () => usePositionsStore.getState().getData()?.totals;
export const selectHasPositions = () => {
  const data = usePositionsStore.getState().getData() as RainbowPositions | null;
  return data ? Object.keys(data.positions).length > 0 : false;
};
