import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { ChainId } from '@/state/backendNetworks/types';
import { METADATA_BASE_URL } from 'react-native-dotenv';
import { IS_TEST } from '@/env';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { mockMeteorologyData } from '@/e2e-mocks/meteorology';

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

export const rainbowMeteorologyGetData = <T>(chainId: ChainId, abortController?: AbortController | null) => {
  // Return mocked data for anvil tests to ensure gas fees are high enough
  if (IS_TEST && useConnectedToAnvilStore.getState().connectedToAnvil) {
    return Promise.resolve({ data: mockMeteorologyData as T });
  }
  return getRainbowMeteorologyApi().get<T>(`/meteorology/v1/gas/${useBackendNetworksStore.getState().getChainsName()[chainId]}`, {
    abortController,
  });
};
