import { RainbowFetchClient } from '@/rainbow-fetch';
import { PLATFORM_BASE_URL } from 'react-native-dotenv';

let platformClient: RainbowFetchClient | undefined;

export function getPlatformClient() {
  const clientUrl = platformClient?.baseURL;
  const baseUrl = PLATFORM_BASE_URL;
  if (!platformClient || clientUrl !== baseUrl) {
    platformClient = new RainbowFetchClient({
      baseURL: PLATFORM_BASE_URL,
    });
  }

  return platformClient;
}
