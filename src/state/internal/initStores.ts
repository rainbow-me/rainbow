import { configureStores } from '@storesjs/stores';

import { logger } from '@/logger';

import { rainbowStorage } from './rainbowStorage';

export function initStores(): void {
  configureStores({
    logger: logger.createServiceLogger(logger.DebugContext.stores),
    queryStoreDefaults: { useParsableQueryKeys: false },
    storage: rainbowStorage,
  });
}
