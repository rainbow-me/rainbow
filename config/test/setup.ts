import './native';

import { configureStores } from '@storesjs/stores';
import { vi } from 'vitest';

import { rainbowStorage } from '@/state/internal/rainbowStorage';

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

configureStores({ storage: rainbowStorage });
