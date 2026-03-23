import { configure as configureDelegationClient } from '@rainbow-me/delegation';
import { logger } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { relayService } from './relayService';

// ============ Delegation Client ============================================== //

/**
 * Configures the `@rainbow-me/delegation` SDK client.
 *
 * Called eagerly during app initialization — the SDK is lazy internally.
 */
export function configureDelegationSdk(): void {
  configureDelegationClient({
    platformClient: getPlatformClient(),
    logger: logger.createServiceLogger(logger.DebugContext.delegation),
    getCurrentAddress: $ => $(useWalletsStore, s => s.accountAddress),
    ...relayService,
  });
}
