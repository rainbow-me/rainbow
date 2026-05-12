import { configureStores } from '@storesjs/stores';

import { logger } from '@/logger';

export function initStores(): void {
  configureStores({
    logger: logger.createServiceLogger(logger.DebugContext.stores),
  });
}
