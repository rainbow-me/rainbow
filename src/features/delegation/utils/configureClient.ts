import { logger } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { configure } from '@rainbow-me/sdk';

import { relayService } from './relayService';

// ============ SDK Configuration ============================================== //

/**
 * Configures the Rainbow SDK.
 *
 * Called eagerly during app initialization — the SDK is lazy internally.
 */
export function configureRainbowSdk(): void {
  configure({
    platformClient: getPlatformClient(),
    logger: logger.createServiceLogger(logger.DebugContext.sdk),
    getCurrentAddress: $ => $(useWalletsStore, s => s.accountAddress),
    relayService,
  });
}
