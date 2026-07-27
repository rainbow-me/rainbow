import { CASH_PLATFORM_API_KEY, CASH_PLATFORM_BASE_URL } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';

let platformClient: RainbowFetchClient | undefined;

export function buildAuthenticatedHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// TODO: replace with src/resources/platform/client.ts
// once cash related backend is completely deployed to production
export function getCashPlatformClient(): RainbowFetchClient {
  return (platformClient ??= new RainbowFetchClient({
    baseURL: `${CASH_PLATFORM_BASE_URL}/v1`,
    headers: {
      Authorization: `Bearer ${CASH_PLATFORM_API_KEY}`,
    },
  }));
}
