import { createBaseStore } from '@storesjs/stores';

type CashAuthToken = {
  accessToken: string;
  expiresAt: number;
};

type CashAuthTokenStore = {
  token: CashAuthToken | null;
  setToken: (token: CashAuthToken) => void;
  clearToken: () => void;
};

// Deliberately memory-only — the short-lived access token is never persisted.
export const useCashAuthTokenStore = createBaseStore<CashAuthTokenStore>(set => ({
  token: null,
  setToken: token => set({ token }),
  clearToken: () => set({ token: null }),
}));
