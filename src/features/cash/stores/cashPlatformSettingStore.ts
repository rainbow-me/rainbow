import { createBaseStore } from '@storesjs/stores';

type CashPlatformSettingStore = {
  useStagingPlatform: boolean;
};

// Read once at startup, so changing it only takes effect after a restart.
export const useCashPlatformSettingStore = createBaseStore<CashPlatformSettingStore>(() => ({ useStagingPlatform: false }), {
  storageKey: 'cashPlatformSetting',
  // Flush on the next tick so the app restart that follows a change cannot drop it.
  persistThrottleMs: 0,
});
