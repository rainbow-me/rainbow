import { createClient } from '@reservoir0x/reservoir-sdk';
import { IS_PROD } from '@/env';
import { RESERVOIR_API_KEY_PROD, RESERVOIR_API_KEY_DEV } from 'react-native-dotenv';
import { ChainId, Network } from '@/state/backendNetworks/types';

const RESERVOIR_API_KEY = IS_PROD ? RESERVOIR_API_KEY_PROD : RESERVOIR_API_KEY_DEV;

export function initializeReservoirClient() {
  createClient({
    chains: [
      {
        name: Network.mainnet,
        id: ChainId.mainnet,
        baseApiUrl: 'https://api.reservoir.tools',
        active: true,
      },
      {
        name: Network.polygon,
        id: ChainId.polygon,
        baseApiUrl: 'https://api-polygon.reservoir.tools',
        active: false,
      },
      {
        name: Network.zora,
        id: ChainId.zora,
        baseApiUrl: 'https://api-zora.reservoir.tools',
        active: false,
      },
      {
        name: Network.base,
        id: ChainId.base,
        baseApiUrl: 'https://api-base.reservoir.tools',
        active: false,
      },
      {
        name: Network.optimism,
        id: ChainId.optimism,
        baseApiUrl: 'https://api-optimism.reservoir.tools',
        active: false,
      },
      {
        name: Network.arbitrum,
        id: ChainId.arbitrum,
        baseApiUrl: 'https://api-arbitrum.reservoir.tools',
        active: false,
      },
    ],
    apiKey: RESERVOIR_API_KEY,
    source: 'rainbow.me',
    logLevel: IS_PROD ? 1 : 4,
  });
}
