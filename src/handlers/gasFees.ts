import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { RainbowFetchClient } from '../rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { METADATA_BASE_URL } from 'react-native-dotenv';
let rainbowMeteorologyApi: RainbowFetchClient | undefined;

export const getRainbowMeteorologyApi = () => {
  const clientUrl = rainbowMeteorologyApi?.baseURL;
  const baseUrl = METADATA_BASE_URL;
  if (!rainbowMeteorologyApi || clientUrl !== baseUrl) {
    rainbowMeteorologyApi = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 secs
    });
  }
  return rainbowMeteorologyApi;
};

export const rainbowMeteorologyGetData = (chainId: ChainId) =>
  getRainbowMeteorologyApi().get(`/meteorology/v1/gas/${useBackendNetworksStore.getState().getChainsName()[chainId]}`, {});
