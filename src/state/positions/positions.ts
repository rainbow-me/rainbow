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
  getPositionTokenAddresses: () => Set<string>;
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
    getPositionTokenAddresses: () => {
      const positionTokenAddresses = new Set<string>();
      const data = get().getData();

      if (data?.positions) {
        Object.values(data.positions).forEach(position => {
          position.deposits?.forEach(deposit => {
            if (deposit.pool_address) {
              positionTokenAddresses.add(deposit.pool_address.toLowerCase());
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
    version: 1,
  }
);
