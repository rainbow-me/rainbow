import { time } from '@/utils/time';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import type { RainbowPositions, RainbowPosition, RainbowDeposit, RainbowPool, RainbowBorrow, RainbowReward } from '../types';
import type { ListPositionsResponse } from '../types/generated/positions/positions';
import { fetchPositions, type PositionsParams } from './fetcher';
import { transformPositions } from './transform';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { throttle } from 'lodash';
import { analytics } from '@/analytics';

// ============ Core Types ===================================================== //

type PositionsState = {
  getPositionTokenAddresses: () => Set<string>;
};

// ============ Constants ====================================================== //

const CACHE_TIME = time.days(2);
const STALE_TIME = time.minutes(10);
const RETRY_DELAY = time.minutes(1);

// ============ Retry Tracking ================================================= //

/**
 * The backend lazy-loads positions data. The first fetch for a new address often
 * returns empty results, requiring a second fetch ~1 minute later to get hydrated data.
 *
 * Tracks retry state per address:
 * - Not in map: never fetched or has positions
 * - NodeJS.Timeout: retry scheduled
 * - null: already retried once
 */
const hydrationRetry = new Map<string, NodeJS.Timeout | null>();

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
    onFetched: ({ data, fetch, params }) => {
      const address = params.address?.toLowerCase();
      if (!address) return;

      const retry = hydrationRetry.get(address);
      if (retry) clearTimeout(retry);

      const hasPositions = data?.positions && Object.keys(data.positions).length > 0;

      if (hasPositions) {
        hydrationRetry.delete(address);
      } else if (retry === undefined) {
        hydrationRetry.set(
          address,
          setTimeout(() => fetch(undefined, { force: true }), RETRY_DELAY)
        );
      } else {
        hydrationRetry.set(address, null);
      }

      requestIdleCallback(() => throttledPositionsAnalytics(data, address));
    },
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
          position.borrows?.forEach(borrow => {
            if (borrow.poolAddress) {
              positionTokenAddresses.add(borrow.poolAddress.toLowerCase());
            }
          });
          position.rewards?.forEach(reward => {
            if (reward.poolAddress) {
              positionTokenAddresses.add(reward.poolAddress.toLowerCase());
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

// ============ Analytics ====================================================== //

/**
 * User properties analytics for positions (throttled once per hour).
 * Mirrors claimables behavior - tracks all wallet types, throttle is global across addresses.
 * Wallet will eventually be tracked on the next hour if still selected.
 */
const throttledPositionsAnalytics = throttle(
  (positions: RainbowPositions, address: string) => {
    const positionsList = Object.values(positions.positions);
    const { positionsAmount, positionsRewardsAmount } = positionsList.reduce(
      (acc, position) => ({
        positionsAmount:
          acc.positionsAmount +
          position.deposits.length +
          position.pools.length +
          position.stakes.length +
          position.borrows.length +
          position.rewards.length,
        positionsRewardsAmount: acc.positionsRewardsAmount + position.rewards.length,
      }),
      { positionsAmount: 0, positionsRewardsAmount: 0 }
    );

    analytics.identify({
      positionsAmount,
      positionsUSDValue: Number(positions.totals.total.amount),
      positionsRewardsAmount,
      positionsRewardsUSDValue: Number(positions.totals.totalRewards.amount),
      positions: positionsList.length,
    });
  },
  time.hours(1),
  { trailing: false }
);
