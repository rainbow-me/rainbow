import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashBuyOrderStore } from '../stores/cashBuyOrderStore';
import { useCashPaymentMethodStore } from '../stores/cashPaymentMethodStore';
import { useCashPlatformSettingStore } from '../stores/cashPlatformSettingStore';
import { useCashWalletStore } from '../stores/cashWalletStore';

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

/** Persisted cash state belongs to one platform's accounts and orders, so it is wiped on every switch. Restart the app afterwards. */
export function setCashStagingPlatform(useStagingPlatform: boolean): void {
  clearPersistedStore(useCashAccountStore);
  clearPersistedStore(useCashBuyOrderStore);
  clearPersistedStore(useCashPaymentMethodStore);
  clearPersistedStore(useCashWalletStore);
  useCashPlatformSettingStore.setState({ useStagingPlatform });
}
