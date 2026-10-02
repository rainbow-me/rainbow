import './native';

import { vi } from 'vitest';

vi.stubGlobal('__DEV__', true);
vi.stubGlobal('ios', false);
vi.stubGlobal('android', false);

vi.mock('@/env', () => ({
  IS_DEV: false,
  IS_PROD: false,
  IS_STORE_INSTALL: false,
  IS_TEST: true,
  IS_WEB: false,
  RPC_PROXY_API_KEY: undefined,
  RPC_PROXY_BASE_URL: undefined,
  web: false,
}));

// Initialize storage on the first store import, preserving the real exports.
vi.mock('@storesjs/stores', async importOriginal => {
  const stores = await importOriginal<typeof import('@storesjs/stores')>();
  const { rainbowStorage } = await import('@/state/internal/rainbowStorage');
  stores.configureStores({ storage: rainbowStorage });
  return stores;
});
