import { createQueryStore } from '@storesjs/stores';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { time } from '@/framework/core/utils/time';
import { greaterThan, subtract } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import type { RainbowPositions } from '../types';
import type { ListPositionsResponse } from '../types/generated/positions/positions';
import { fetchPositions, type PositionsParams } from './fetcher';
import { transformPositions } from './transform';

// ============ Types ========================================================== //

type PositionsState = { getBalance: () => string };

// ============ Positions Store ================================================ //

export const usePositionsStore = createQueryStore<ListPositionsResponse | null, PositionsParams, PositionsState, RainbowPositions | null>(
  {
    fetcher: fetchPositions,
    transform: (response, params) => (response ? transformPositions(response, params) : null),
    params: {
      address: $ => $(useWalletsStore, s => s.accountAddress),
      currency: $ => $(userAssetsStoreManager, s => s.currency),
      chainIds: $ => $(useBackendNetworksStore, s => s.getSupportedPositionsChainIds()),
    },
    cacheTime: time.days(2),
    staleTime: time.minutes(10),
  },

  (_, get) => ({
    getBalance: () => {
      const data = get().getData();
      if (!data) return '0';
      const balance = subtract(data.totals.total.amount, data.totals.totalLocked.amount);
      return greaterThan(balance, '0') ? balance : '0';
    },
  }),

  { storageKey: 'positions', version: 3 }
);
