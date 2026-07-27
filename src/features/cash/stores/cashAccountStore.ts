import { createBaseStore } from '@storesjs/stores';

import { useCashAuthTokenStore } from './cashAuthTokenStore';

type CashAccountStore = {
  /** UserService account UUID, captured at passkey enrollment. Presence = an account with a passkey exists. */
  userId: string | null;
  setUserId: (userId: string) => void;
  clearUserId: () => void;
};

// A cached access token belongs to whichever account minted it — drop it whenever the record changes.
export const useCashAccountStore = createBaseStore<CashAccountStore>(
  set => ({
    userId: null,
    setUserId: userId => {
      useCashAuthTokenStore.getState().clearToken();
      set({ userId });
    },
    clearUserId: () => {
      useCashAuthTokenStore.getState().clearToken();
      set({ userId: null });
    },
  }),
  { storageKey: 'cashAccount' }
);
