import { configureStores } from '@storesjs/stores';

import { logger } from '@/logger';

import { ensureLegacyStoresMigrated } from './migrations/migrateLegacyStoresStorage';
import { rainbowStorage } from './rainbowStorage';

export function initStores(): void {
  ensureLegacyStoresMigrated();

  configureStores({
    logger: logger.createServiceLogger(logger.DebugContext.stores),
    storage: rainbowStorage,
  });
}
