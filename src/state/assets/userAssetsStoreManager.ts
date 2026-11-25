import { createBaseStore } from '@storesjs/stores';
import { type Address } from 'viem';

import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { NativeCurrencyKeys } from '@/features/currency/types';

export type StoreManagerState = {
  currency: SupportedCurrencyKey;
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
};

export const userAssetsStoreManager = createBaseStore<StoreManagerState>(
  set => ({
    currency: NativeCurrencyKeys.USD,
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
      currency: state.currency,
      hiddenAssetBalances: state.hiddenAssetBalances,
    }),
    storageKey: 'userAssetsStoreManager',
  }
);
