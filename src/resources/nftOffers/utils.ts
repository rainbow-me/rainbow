import { createClient } from '@reservoir0x/reservoir-sdk';
import { IS_PROD } from '@/env';
import {
  RESERVOIR_API_KEY_PROD,
  RESERVOIR_API_KEY_DEV,
} from 'react-native-dotenv';

const RESERVOIR_API_KEY = IS_PROD
  ? RESERVOIR_API_KEY_PROD
  : RESERVOIR_API_KEY_DEV;

export function initializeReservoirClient() {
  createClient({
    chains: [
      {
        id: 1,
        baseApiUrl: 'https://api.reservoir.tools',
        active: true,
        apiKey: RESERVOIR_API_KEY,
      },
      {
        id: 137,
        baseApiUrl: 'https://api-polygon.reservoir.tools',
        active: false,
        apiKey: RESERVOIR_API_KEY,
      },
    ],
    source: 'rainbow.me',
    logLevel: IS_PROD ? 1 : 4,
  });
}
