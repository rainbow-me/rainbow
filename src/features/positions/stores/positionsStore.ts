import { createQueryStore, parseQueryKey } from '@storesjs/stores';
import { throttle } from 'lodash';

import { analytics } from '@/analytics';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { time } from '@/framework/core/utils/time';
import { greaterThan, subtract } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import type { RainbowPositions } from '../types';
import type { ListPositionsResponse } from '../types/generated/positions/positions';
import { fetchPositions, type PositionsParams } from './fetcher';
import { transformPositions } from './transform';

// ============ Core Types ===================================================== //

type PositionsState = {
  getTokenAddresses: (address: PositionsParams['address']) => Set<string>;
  getBalance: () => string;
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
      address: $ => $(useWalletsStore).accountAddress,
      currency: $ => $(userAssetsStoreManager).currency,
      chainIds: $ => $(useBackendNetworksStore, s => s.getSupportedPositionsChainIds()),
    },
    keepPreviousData: true,
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
    enabled: $ => $(useWalletsStore, state => !!state.accountAddress),
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

      requestIdleCallback(() => throttledPositionsAnalytics(params));
    },
  },
  (_, get) => ({
    /** Returns pool tokens represented by positions for the requested account. */
    getTokenAddresses: address => {
      const addresses = new Set<string>();
      const state = get();
      const currentAddress = state.queryKey ? parseQueryKey<PositionsParams>(state.queryKey).address : undefined;
      const data =
        currentAddress === address
          ? state.getData()
          : state.getData({
              address,
              currency: userAssetsStoreManager.getState().currency,
              chainIds: useBackendNetworksStore.getState().getSupportedPositionsChainIds(),
            });
      const positions = data?.positions;
      if (!positions) return addresses;

      for (const position of Object.values(positions)) {
        for (const category of [position.deposits, position.pools, position.stakes, position.borrows, position.rewards]) {
          for (const { poolAddress } of category) {
            if (poolAddress) addresses.add(poolAddress.toLowerCase());
          }
        }
      }
      return addresses;
    },
    /**
     * Used to calculate the live wallet balance
     */
    getBalance: () => {
      const data = get().getData();
      if (!data) return '0';
      // Returns available balance (total - locked) with floor of $0
      // Prevents locked positions and negative net positions from affecting wallet balance
      const balance = subtract(data.totals.total.amount, data.totals.totalLocked.amount);
      return greaterThan(balance, '0') ? balance : '0';
    },
  }),
  {
    storageKey: 'positions',
    version: 3,
  }
);

// ============ Analytics ====================================================== //

/**
 * User properties analytics for positions (throttled once per day).
 * Mirrors claimables behavior - tracks all wallet types.
 * Fetches latest positions from store on each execution.
 */
const throttledPositionsAnalytics = throttle(
  (params: PositionsParams) => {
    const positions = usePositionsStore.getState().getData(params);
    if (!positions) return;

    const { positionsAmount, positionsRewardsAmount, positionsAssetsAmount } = Object.values(positions.positions).reduce(
      (acc, position) => {
        (['deposits', 'pools', 'stakes', 'borrows', 'rewards'] as const).forEach(category => {
          acc.positionsAmount += position[category].length;
          if (category === 'rewards') acc.positionsRewardsAmount += position[category].length;
          position[category].forEach(item => (acc.positionsAssetsAmount += item.underlying.length));
        });
        return acc;
      },
      { positionsAmount: 0, positionsRewardsAmount: 0, positionsAssetsAmount: 0 }
    );

    analytics.identify({
      positionsAmount,
      positionsUSDValue: Number(positions.totals.total.amount),
      positionsAssetsAmount,
      positionsDappsAmount: Object.keys(positions.positions).length,
      positionsRewardsAmount,
      positionsRewardsUSDValue: Number(positions.totals.totalRewards.amount),
    });
  },
  time.days(1),
  { trailing: false }
);
