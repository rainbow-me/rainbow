import { GATEWAY_API_KEY, GATEWAY_BASE_URL } from 'react-native-dotenv';
import { RainbowFetchClient } from '@/rainbow-fetch';

let gatewayHttp: RainbowFetchClient | undefined;

export const getGatewayHttpClient = () => {
  const clientUrl = gatewayHttp?.baseURL;
  const baseUrl = GATEWAY_BASE_URL;
  if (!gatewayHttp || clientUrl !== baseUrl) {
    gatewayHttp = new RainbowFetchClient({
      baseURL: GATEWAY_BASE_URL,
      headers: {
        Authorization: `Bearer ${GATEWAY_API_KEY}`,
      },
    });
  }

  return gatewayHttp;
};
