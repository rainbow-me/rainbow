import { NativeCurrencyKey } from '@/entities';
import { RainbowPosition, RainbowPositions } from '@/resources/defi/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { Address } from 'viem';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { time } from '@/utils';
import { getPositions } from '@/resources/defi/PositionsQuery';

type PositionsStoreParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
};

type PositionStoreActions = {
  getPosition: (uniqueId: string) => RainbowPosition | undefined;
};

export const usePositionsStore = createQueryStore<RainbowPositions, PositionsStoreParams, PositionStoreActions>(
  {
    fetcher: async ({ address, currency }, abortController) => {
      return await getPositions(address, currency, abortController);
    },
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    keepPreviousData: true,
    enabled: $ => $(userAssetsStoreManager, state => !!state.address),
    staleTime: time.minutes(10),
  },
  (_, get) => ({
    getPosition: (uniqueId: string) => {
      return get().getData()?.positions[uniqueId];
    },
  }),
  {
    storageKey: 'positions',
    version: 1,
  }
);
