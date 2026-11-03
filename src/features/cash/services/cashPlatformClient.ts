import { CASH_PLATFORM_API_KEY, CASH_PLATFORM_BASE_URL } from 'react-native-dotenv';

import { IS_STORE_INSTALL } from '@/env';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { useCashPlatformSettingStore } from '../stores/cashPlatformSettingStore';

let stagingClient: RainbowFetchClient | undefined;

export function buildAuthenticatedHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Store installs always use the production platform. Elsewhere a developer setting can switch to the
// staging platform while cash backend changes roll out.
export const USES_STAGING_PLATFORM = !IS_STORE_INSTALL && useCashPlatformSettingStore.getState().useStagingPlatform;

export function getCashPlatformClient(): RainbowFetchClient {
  if (!USES_STAGING_PLATFORM) return getPlatformClient();

  return (stagingClient ??= new RainbowFetchClient({
    baseURL: `${CASH_PLATFORM_BASE_URL}/v1`,
    headers: {
      Authorization: `Bearer ${CASH_PLATFORM_API_KEY}`,
    },
  }));
}
