import {
  PLATFORM_BASE_URL,
  RAINBOW_RELAY_API_KEY,
  RAINBOW_RELAY_GO_BACKEND_API_KEY,
  RAINBOW_RELAY_GO_BACKEND_QUOTE_SIGNER,
  RAINBOW_RELAY_QUOTE_SIGNER,
  RAINBOW_RELAY_URL,
} from 'react-native-dotenv';
import { getAddress } from 'viem';

import { GO_RELAY_BACKEND } from '@/config/experimental';
import { getExperimentalFlag } from '@/config/experimentalConfigStore';
import { createRelayService } from '@rainbow-me/delegation';

export type RelayStatusResponse = Awaited<ReturnType<typeof relayService.getStatus>>;

export const relayService = createRelayService(
  getExperimentalFlag(GO_RELAY_BACKEND)
    ? {
        apiKey: RAINBOW_RELAY_GO_BACKEND_API_KEY,
        baseUrl: PLATFORM_BASE_URL,
        quoteSigner: getAddress(RAINBOW_RELAY_GO_BACKEND_QUOTE_SIGNER),
      }
    : {
        apiKey: RAINBOW_RELAY_API_KEY,
        baseUrl: RAINBOW_RELAY_URL,
        quoteSigner: getAddress(RAINBOW_RELAY_QUOTE_SIGNER),
      }
);
