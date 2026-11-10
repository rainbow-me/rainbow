import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

export type StoreManagerState = {
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
};

export const userAssetsStoreManager = createBaseStore<StoreManagerState>(
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
