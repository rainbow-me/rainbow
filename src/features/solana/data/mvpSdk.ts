import {
  PLATFORM_API_KEY,
  PLATFORM_BASE_URL,
  RAINBOW_RELAY_API_KEY,
  RAINBOW_RELAY_GO_BACKEND_QUOTE_SIGNER,
  RAINBOW_RELAY_QUOTE_SIGNER,
  RAINBOW_RELAY_URL,
} from 'react-native-dotenv';
import { getAddress } from 'viem';

import { GO_RELAY_BACKEND } from '@/features/config/constants/experimental';
import { getExperimentalFlag } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { getSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { logger } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { configure, createRelayService } from '@rainbow-me/solana-sdk';

let configured = false;

export function configureSolanaMvpSdk(): void {
  getSolanaSource();
  if (configured) return;
  const go = getExperimentalFlag(GO_RELAY_BACKEND) && useRemoteConfigStore.getState().getRemoteConfigKey('go_relay_backend_enabled');
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
      apiKey: go ? PLATFORM_API_KEY : RAINBOW_RELAY_API_KEY,
      baseUrl: go ? PLATFORM_BASE_URL : RAINBOW_RELAY_URL,
      relayDomain: {
        environment: 'production',
        relayId: 'rainbow-relay',
        relayVersion: 2n,
        prepareSigner: getAddress(go ? RAINBOW_RELAY_GO_BACKEND_QUOTE_SIGNER : RAINBOW_RELAY_QUOTE_SIGNER),
      },
    }),
  });
  configured = true;
}
