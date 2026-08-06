import { PLATFORM_API_KEY, PLATFORM_BASE_URL } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';

let platformClient: RainbowFetchClient | undefined;
let platformV2Client: RainbowFetchClient | undefined;

export function getPlatformClient(): RainbowFetchClient {
  const clientUrl = platformClient?.baseURL;
  const baseUrl = `${PLATFORM_BASE_URL}/v1`;
  if (!platformClient || clientUrl !== baseUrl) {
    platformClient = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
      },
    });
  }

  return platformClient;
}

/**
 * The chain-agnostic namespace, whose requests and responses carry CAIP
 * identifiers rather than numeric chain ids and hex addresses.
 */
export function getPlatformV2Client(): RainbowFetchClient {
  const clientUrl = platformV2Client?.baseURL;
  const baseUrl = `${PLATFORM_BASE_URL}/v2`;
  if (!platformV2Client || clientUrl !== baseUrl) {
    platformV2Client = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${PLATFORM_API_KEY}`,
      },
    });
  }

  return platformV2Client;
}
