import { createBaseStore } from '@storesjs/stores';

import { useCashAuthTokenStore } from './cashAuthTokenStore';
import { useCashPaymentMethodStore } from './cashPaymentMethodStore';
import { useCashWalletStore } from './cashWalletStore';

type CashAccountStore = {
  /** UserService account UUID, captured at passkey enrollment. Presence = an account with a passkey exists. */
  userId: string | null;
  setUserId: (userId: string) => void;
  clearUserId: () => void;
};

// A cached access token, the linked wallets and the linked card belong to whichever account they
// came from — drop them all whenever the record changes.
function clearAccountScopedState(): void {
  useCashAuthTokenStore.getState().clearToken();
  useCashWalletStore.getState().clear();
  useCashPaymentMethodStore.getState().clear();
}

export const useCashAccountStore = createBaseStore<CashAccountStore>(
  (set, get) => ({
    userId: null,
    setUserId: userId => {
      if (get().userId === userId) return;
      clearAccountScopedState();
      set({ userId });
    },
    clearUserId: () => {
      clearAccountScopedState();
      set({ userId: null });
    },
  }),
  { storageKey: 'cashAccount' }
);
