import { createBaseStore, createVirtualStore, shallowEqual } from '@storesjs/stores';

import { type NativeCurrencyKey } from '@/features/currency/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

type CachedWalletBalance = {
  totalBalanceAmount: string;
  totalBalanceDisplay: string;
  balanceMinusHiddenDisplay: string;
};

type WalletBalanceSnapshot = {
  address: string;
  currency: NativeCurrencyKey;
  cachedBalance: CachedWalletBalance | null;
};

type WalletBalancesState = {
  balances: Record<string, CachedWalletBalance | undefined>;
  cacheBalance: (snapshot: WalletBalanceSnapshot) => void;
};

// Switching currency rehydrates that currency's last-seen balances without fetching wallets.
export const useWalletBalancesStore = createVirtualStore($ => {
  const currency = $(userAssetsStoreManager, state => state.currency);

  return createBaseStore<WalletBalancesState>(
    (set, get) => ({
      balances: {},
      cacheBalance: snapshot => {
        const { cachedBalance } = snapshot;
        if (!snapshot.address || snapshot.currency !== currency || !cachedBalance) return;
        const address = snapshot.address.toLowerCase();
        if (shallowEqual(get().balances[address], cachedBalance)) return;
        set(state => ({ balances: { ...state.balances, [address]: cachedBalance } }));
      },
    }),
    { storageKey: `walletBalances_${currency}`, partialize: state => ({ balances: state.balances }) }
  );
});
