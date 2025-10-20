import { time } from '@/utils/time';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import type { RainbowPositions, RainbowPosition, RainbowDeposit, RainbowPool } from '../types';
import type { ListPositionsResponse } from '../types/generated/positions/positions';
import { fetchPositions, type PositionsParams } from './fetcher';
import { transformPositions } from './transform';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

// ============ Core Types ===================================================== //

type PositionsState = {
  getPositionTokenAddresses: () => Set<string>;
};

// ============ Constants ====================================================== //

const CACHE_TIME = time.days(2);
const STALE_TIME = time.minutes(10);

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
  (_, get) => ({
    getPositionTokenAddresses: () => {
      const positionTokenAddresses = new Set<string>();
      const data = get().getData();

      if (data?.positions) {
        Object.values(data.positions).forEach((position: RainbowPosition) => {
          position.deposits?.forEach((deposit: RainbowDeposit) => {
            if (deposit.poolAddress) {
              positionTokenAddresses.add(deposit.poolAddress.toLowerCase());
            }
          });
          position.pools?.forEach((pool: RainbowPool) => {
            if (pool.poolAddress) {
              positionTokenAddresses.add(pool.poolAddress.toLowerCase());
            }
          });
          position.stakes?.forEach(stake => {
            if (stake.poolAddress) {
              positionTokenAddresses.add(stake.poolAddress.toLowerCase());
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
