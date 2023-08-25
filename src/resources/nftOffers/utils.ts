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
        apiKey: 'c5cb3233-4921-528d-bafa-d4ca2f739bed',
      },
      {
        id: 137,
        baseApiUrl: 'https://api-polygon.reservoir.tools',
        active: true,
        apiKey: 'c5cb3233-4921-528d-bafa-d4ca2f739bed',
      },
      {
        id: 7777777,
        baseApiUrl: 'https://api-zora.reservoir.tools',
        active: true,
        apiKey: 'c5cb3233-4921-528d-bafa-d4ca2f739bed'
      }
    ],
    logLevel: IS_PROD ? 1 : 4,
  });
}
