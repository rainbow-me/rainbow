import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import { getPositions } from '@/resources/defi/PositionsQuery';
import { RainbowPosition, RainbowPositions } from '@/resources/defi/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';

type PositionsParams = {
  address: Address | string;
  currency: NativeCurrencyKey;
};

type PositionsActions = {
  getPosition: (uniqueId: string) => RainbowPosition | undefined;
};

export const usePositionsStore = createQueryStore<RainbowPositions, PositionsParams, PositionsActions>(
  {
    fetcher: getPositions,
    params: {
      address: $ => $(useWalletsStore).accountAddress,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    keepPreviousData: true,
    staleTime: time.minutes(10),
  },

  (_, get) => ({
    getPosition: uniqueId => get().getData()?.positions[uniqueId],
  }),

  {
    storageKey: 'positions',
    version: 1,
  }
);

const EMPTY_TOKEN_ADDRESSES: Set<string> = new Set();

export const usePositionsTokenAddresses = createDerivedStore(
  $ => {
    const positions = $(usePositionsStore, state => state.getData()?.positions);
    if (!positions) return EMPTY_TOKEN_ADDRESSES;

    const addresses = new Set<string>();

    Object.values(positions).forEach(position => {
      position.deposits?.forEach(deposit => {
        if (deposit.pool_address) addresses.add(deposit.pool_address.toLowerCase());
      });

      position.stakes?.forEach(stake => {
        if (stake.pool_address) addresses.add(stake.pool_address.toLowerCase());
      });
    });

    return addresses.size ? addresses : EMPTY_TOKEN_ADDRESSES;
  },

  { fastMode: true }
);
