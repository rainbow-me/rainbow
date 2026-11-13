import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

export type HiddenAssetBalancesState = {
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
};

export const useHiddenAssetBalancesStore = createBaseStore<HiddenAssetBalancesState>(
  set => ({
    hiddenAssetBalances: {},

    setHiddenAssetBalance: (address, balance) => {
      set(state => {
        const newHiddenAssetBalances = { ...state.hiddenAssetBalances };
        newHiddenAssetBalances[address] = balance;
        return { hiddenAssetBalances: newHiddenAssetBalances };
      });
    },
  }),
  {
    storageKey: 'userAssetsStoreManager',
  }
);
