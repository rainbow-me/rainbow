import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { useCashBuyOrderStore } from '../stores/cashBuyOrderStore';
import { useCashPaymentMethodStore } from '../stores/cashPaymentMethodStore';
import { useCashPlatformSettingStore } from '../stores/cashPlatformSettingStore';
import { useCashSetupSessionStore } from '../stores/cashSetupSessionStore';
import { useCashWalletStore } from '../stores/cashWalletStore';
import { ensureAccessToken } from './cashSignInService';
import { hardDeleteSelf, logout } from './userClient';

type PersistedStore<S> = {
  getInitialState: () => S;
  setState: (state: S, replace: true) => void;
  persist: { clearStorage: () => void };
};

function clearPersistedStore<S>(store: PersistedStore<S>): void {
  // Reset in memory first: a throttled write still pending would otherwise restore the removed entry.
  store.setState(store.getInitialState(), true);
  store.persist.clearStorage();
}

function clearCashState(): void {
  clearPersistedStore(useCashAccountStore);
  clearPersistedStore(useCashBuyOrderStore);
  clearPersistedStore(useCashPaymentMethodStore);
  clearPersistedStore(useCashWalletStore);
  useCashAuthTokenStore.getState().clearToken();
  useCashSetupSessionStore.getState().reset();
}

/** Persisted cash state belongs to one platform's accounts and orders, so it is wiped on every switch. Restart the app afterwards. */
export function setCashStagingPlatform(useStagingPlatform: boolean): void {
  clearCashState();
  useCashPlatformSettingStore.setState({ useStagingPlatform });
}

export async function signOutOfCash(): Promise<void> {
  await logout(await ensureAccessToken('developerSettings'));
  clearCashState();
}

export async function deleteCashAccount(): Promise<void> {
  await hardDeleteSelf(await ensureAccessToken('developerSettings'));
  clearCashState();
}
