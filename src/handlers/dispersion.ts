import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress } from '@rainbow-me/entities';

const dispersionApi = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getUniswapV2Pools = async (token?: EthereumAddress) => {
  const tokenPath = token ? `/${token}` : '';
  return await dispersionApi.get(`/dispersion/v1/pools/uniswap/v2${tokenPath}`);
};
