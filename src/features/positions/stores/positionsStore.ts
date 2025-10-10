import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import type { RainbowPositions, ListPositionsResponse, RainbowPosition, RainbowDeposit, RainbowPool } from '../types';
import { fetchPositions, type PositionsParams, CACHE_TIME, STALE_TIME } from './fetcher';
import { transformPositions } from './transform';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

// ============ Core Types ===================================================== //

type PositionsState = {
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
    keepPreviousData: true,
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
    enabled: $ => $(userAssetsStoreManager, state => !!state.address),
  },
  (_: unknown, get) => ({
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
          position.stakes?.forEach(stake => {
            if (stake.pool_address) {
              positionTokenAddresses.add(stake.pool_address.toLowerCase());
            }
          });
        });
      }

      return positionTokenAddresses;
    },
  }),
  {
    storageKey: 'positions',
    version: 2,
  }
);
