import { createClient } from '@reservoir0x/reservoir-sdk';
import { IS_PROD } from '@/env';
import { RESERVOIR_API_KEY_PROD, RESERVOIR_API_KEY_DEV } from 'react-native-dotenv';
import { baseNetworkObject } from '@/networks/base';
import { arbitrumNetworkObject } from '@/networks/arbitrum';
import { optimismNetworkObject } from '@/networks/optimism';
import { zoraNetworkObject } from '@/networks/zora';
import { polygonNetworkObject } from '@/networks/polygon';
import { mainnetNetworkObject } from '@/networks/mainnet';

const RESERVOIR_API_KEY = IS_PROD ? RESERVOIR_API_KEY_PROD : RESERVOIR_API_KEY_DEV;

export function initializeReservoirClient() {
  createClient({
    chains: [
      {
        name: mainnetNetworkObject.value,
        id: mainnetNetworkObject.id,
        baseApiUrl: 'https://api.reservoir.tools',
        active: true,
      },
      {
        name: polygonNetworkObject.value,
        id: polygonNetworkObject.id,
        baseApiUrl: 'https://api-polygon.reservoir.tools',
        active: false,
      },
      {
        name: zoraNetworkObject.value,
        id: zoraNetworkObject.id,
        baseApiUrl: 'https://api-zora.reservoir.tools',
        active: false,
      },
      {
        name: baseNetworkObject.value,
        id: baseNetworkObject.id,
        baseApiUrl: 'https://api-base.reservoir.tools',
        active: false,
      },
      {
        name: optimismNetworkObject.value,
        id: optimismNetworkObject.id,
        baseApiUrl: 'https://api-optimism.reservoir.tools',
        active: false,
      },
      {
        name: arbitrumNetworkObject.value,
        id: arbitrumNetworkObject.id,
        baseApiUrl: 'https://api-arbitrum.reservoir.tools',
        active: false,
      },
    ],
    apiKey: RESERVOIR_API_KEY,
    source: 'rainbow.me',
    logLevel: IS_PROD ? 1 : 4,
  });
}
