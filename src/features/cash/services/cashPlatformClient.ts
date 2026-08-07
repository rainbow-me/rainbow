import { CASH_PLATFORM_API_KEY, CASH_PLATFORM_BASE_URL, CASH_USE_PROD } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

let stagingClient: RainbowFetchClient | undefined;

export function buildAuthenticatedHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Production unless CASH_USE_PROD=false in .env, which keeps the staging platform
// reachable while cash backend changes roll out.
export const USES_STAGING_PLATFORM = CASH_USE_PROD === 'false';

export function getCashPlatformClient(): RainbowFetchClient {
  if (!USES_STAGING_PLATFORM) return getPlatformClient();

  return (stagingClient ??= new RainbowFetchClient({
    baseURL: `${CASH_PLATFORM_BASE_URL}/v1`,
    headers: {
      Authorization: `Bearer ${CASH_PLATFORM_API_KEY}`,
    },
  }));
}
