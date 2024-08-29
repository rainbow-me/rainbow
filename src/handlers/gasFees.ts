import { RainbowFetchClient } from '../rainbow-fetch';
import { ChainId, chainIdToNameMapping } from '@/networks/types';

const rainbowMeteorologyApi = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export const rainbowMeteorologyGetData = (chainId: ChainId) =>
  rainbowMeteorologyApi.get(`/meteorology/v1/gas/${chainIdToNameMapping[chainId]}`, {});
