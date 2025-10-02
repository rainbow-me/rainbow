import { Address } from 'viem';
import reduxStore from '@/redux/store';
import { SupportedCurrencyKey } from '@/references';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

export type StoreManagerState = {
  address: Address | string | null;
  currency: SupportedCurrencyKey;
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
};

export const userAssetsStoreManager = createRainbowStore<StoreManagerState>(
  set => ({
    address: null,
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

  { storageKey: 'userAssetsStoreManager' }
);

export function useNativeCurrency(): SupportedCurrencyKey {
  return userAssetsStoreManager(selectCurrency);
}

function selectCurrency(state: StoreManagerState): SupportedCurrencyKey {
  return state.currency;
}
