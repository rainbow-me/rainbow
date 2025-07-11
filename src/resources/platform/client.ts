import { RainbowFetchClient } from '@/rainbow-fetch';
import { PLATFORM_API_KEY, PLATFORM_BASE_URL } from 'react-native-dotenv';

let platformClient: RainbowFetchClient | undefined;

export function getPlatformClient() {
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
