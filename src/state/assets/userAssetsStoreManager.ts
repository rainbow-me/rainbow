import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import reduxStore from '@/redux/store';

import { type UserAssetsStoreType } from './types';

export type StoreManagerState = {
  address: Address | string | null;
  cachedStore: UserAssetsStoreType | null;
  currency: SupportedCurrencyKey;
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
};

export const userAssetsStoreManager = createBaseStore<StoreManagerState>(
  set => ({
    address: null,
    cachedStore: null,
    currency: reduxStore.getState().settings.nativeCurrency,
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
    partialize: state => ({
      address: state.address,
      currency: state.currency,
      hiddenAssetBalances: state.hiddenAssetBalances,
    }),
    storageKey: 'userAssetsStoreManager',
  }
);
