import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress } from '@rainbow-me/entities';

const dispersionApi = new RainbowFetchClient({
  baseURL: 'http://localhost:8080',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getUniswapV2Pools = async (token?: EthereumAddress) => {
  const tokenPath = token ? `/${token}` : '';
  return await dispersionApi.get(`/pools/v1/uniswap/v2${tokenPath}`);
};
