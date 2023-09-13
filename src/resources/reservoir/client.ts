import { createClient } from '@reservoir0x/reservoir-sdk';
import { IS_PROD } from '@/env';
import {
  RESERVOIR_API_KEY_PROD,
  RESERVOIR_API_KEY_DEV,
} from 'react-native-dotenv';
import { getBaseNetworkObject } from '@/networks/base';
import { getArbitrumNetworkObject } from '@/networks/arbitrum';
import { getOptimismNetworkObject } from '@/networks/optimism';
import { getZoraNetworkObject } from '@/networks/zora';
import { getPolygonNetworkObject } from '@/networks/polygon';
import { getMainnetNetworkObject } from '@/networks/mainnet';

const RESERVOIR_API_KEY = IS_PROD
  ? RESERVOIR_API_KEY_PROD
  : RESERVOIR_API_KEY_DEV;

export function initializeReservoirClient() {
  createClient({
    chains: [
      {
        id: getMainnetNetworkObject().id,
        baseApiUrl: 'https://api.reservoir.tools',
        active: true,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: getPolygonNetworkObject().id,
        baseApiUrl: 'https://api-polygon.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: getZoraNetworkObject().id,
        baseApiUrl: 'https://api-zora.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: getBaseNetworkObject().id,
        baseApiUrl: 'https://api-base.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: getOptimismNetworkObject().id,
        baseApiUrl: 'https://api-optimism.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: getArbitrumNetworkObject().id,
        baseApiUrl: 'https://api-arbitrum.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
    ],
    logLevel: IS_PROD ? 1 : 4,
  });
}
