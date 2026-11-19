import { getBase64Decoder } from '@solana/codecs-strings';
import { type TransactionMessageBytesBase64 } from '@solana/transactions';
import { RAINBOW_RELAY_API_KEY, RAINBOW_RELAY_QUOTE_SIGNER, RAINBOW_RELAY_URL } from 'react-native-dotenv';
import { getAddress } from 'viem';

import { getSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { logger } from '@/logger';
import { getPlatformClient } from '@/resources/platform/client';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { configure, createRelayService, type RelayExecutionId } from '@rainbow-me/solana-sdk';

let configured = false;
// shortcut: the preview SDK hides prepared messages; retain a bounded, transient copy for the review fee RPC until it exposes them.
const solanaRouteMessages = new Map<RelayExecutionId, TransactionMessageBytesBase64>();

export function takeSolanaRouteMessage(executionId: RelayExecutionId): TransactionMessageBytesBase64 {
  const message = solanaRouteMessages.get(executionId);
  solanaRouteMessages.delete(executionId);
  if (!message) throw new Error('Unable to estimate the Solana network fee. Review a fresh quote.');
  return message;
}

export function configureSolanaMvpSdk(): void {
  getSolanaSource();
  if (configured) return;
  const relayService = createRelayService({
    // Christian's Solana testing uses the Cloudflare reference relay; keep the production relay setting independent.
    apiKey: RAINBOW_RELAY_API_KEY,
    baseUrl: RAINBOW_RELAY_URL,
    relayDomain: {
      environment: 'production',
      relayId: 'rainbow-relay',
      relayVersion: 2n,
      prepareSigner: getAddress(RAINBOW_RELAY_QUOTE_SIGNER),
    },
  });
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
    relayService: {
      ...relayService,
      prepare: async request => {
        const prepared = await relayService.prepare(request);
        const step = prepared.walletProgram[0];
        if (request.intent.kind === 'asset-route' && step?.kind === 'signTransaction') {
          solanaRouteMessages.set(
            prepared.executionId,
            getBase64Decoder().decode(step.transaction.messageBytes) as TransactionMessageBytesBase64
          );
          // A rejected SDK preflight never consumes its message; do not retain an unbounded history.
          if (solanaRouteMessages.size > 8) {
            const oldest = solanaRouteMessages.keys().next().value;
            if (oldest) solanaRouteMessages.delete(oldest);
          }
        }
        return prepared;
      },
    },
  });
  configured = true;
}
