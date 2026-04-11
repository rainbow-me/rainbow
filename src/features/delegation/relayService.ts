import { RAINBOW_RELAY_API_KEY, RAINBOW_RELAY_QUOTE_SIGNER, RAINBOW_RELAY_URL } from 'react-native-dotenv';
import { getAddress } from 'viem';

import { createRelayService } from '@rainbow-me/delegation';

export const relayService = createRelayService({
  apiKey: RAINBOW_RELAY_API_KEY,
  baseUrl: RAINBOW_RELAY_URL,
  quoteSigner: getAddress(RAINBOW_RELAY_QUOTE_SIGNER),
});
