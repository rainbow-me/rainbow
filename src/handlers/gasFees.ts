import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { RainbowFetchClient } from '../rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';

let rainbowMeteorologyApi: RainbowFetchClient | undefined;

export const getRainbowMeteorologyApi = () => {
  const clientUrl = rainbowMeteorologyApi?.baseURL;
  const baseUrl = 'https://metadata.p.rainbow.me';
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
