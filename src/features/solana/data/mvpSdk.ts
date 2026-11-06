import { RAINBOW_RELAY_API_KEY, RAINBOW_RELAY_QUOTE_SIGNER, RAINBOW_RELAY_URL } from 'react-native-dotenv';
import { getAddress } from 'viem';

import { getSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { logger } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { configure, createRelayService } from '@rainbow-me/solana-sdk';

let configured = false;

export function configureSolanaMvpSdk(): void {
  getSolanaSource();
  if (configured) return;
  configure({
    platformClient: getPlatformClient(),
    logger: logger.createServiceLogger(logger.DebugContext.sdk),
    getCurrentAddress: $ => $(useWalletsStore, state => state.accountAddress),
    // The preview SDK hardcodes the same cache key as production. Keep its cache transient and unsynced.
    storeOptions: {
      storage: {
        async: true,
        get: async () => undefined,
        set: async () => undefined,
        delete: async () => undefined,
        clearAll: async () => undefined,
        contains: async () => false,
        getAllKeys: async () => [],
      },
      sync: { engine: { sessionId: 'solana-mvp', register: () => ({ destroy: () => undefined, hydrated: () => true, publish: null }) } },
      shouldEnable: () => true,
    },
    relayService: createRelayService({
      // Christian's Solana testing uses the Cloudflare reference relay; keep the production relay setting independent.
      apiKey: RAINBOW_RELAY_API_KEY,
      baseUrl: RAINBOW_RELAY_URL,
      relayDomain: {
        environment: 'production',
        relayId: 'rainbow-relay',
        relayVersion: 2n,
        prepareSigner: getAddress(RAINBOW_RELAY_QUOTE_SIGNER),
      },
    }),
  });
  configured = true;
}
