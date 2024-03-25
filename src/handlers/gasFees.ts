import { Network } from '@/helpers';
import { RainbowFetchClient } from '../rainbow-fetch';

const rainbowMeteorologyApi = new RainbowFetchClient({
  baseURL: 'https://meteorology.api.s.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secs
});

export const rainbowMeteorologyGetData = (network: Network) => rainbowMeteorologyApi.get(`/meteorology/v1/gas/${network}`, {});
