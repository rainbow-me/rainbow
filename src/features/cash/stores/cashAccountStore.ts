import { createBaseStore } from '@storesjs/stores';

import { useCashAuthTokenStore } from './cashAuthTokenStore';
import { useCashWalletStore } from './cashWalletStore';

type CashAccountStore = {
  /** UserService account UUID, captured at passkey enrollment. Presence = an account with a passkey exists. */
  userId: string | null;
  setUserId: (userId: string) => void;
  clearUserId: () => void;
};

// A cached access token and the linked wallets belong to whichever account they came from — drop
// both whenever the record changes.
function clearAccountScopedState(): void {
  useCashAuthTokenStore.getState().clearToken();
  useCashWalletStore.getState().clear();
}

export const useCashAccountStore = createBaseStore<CashAccountStore>(
  set => ({
    userId: null,
    setUserId: userId => {
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
