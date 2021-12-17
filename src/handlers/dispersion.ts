import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, RainbowToken } from '@rainbow-me/entities';

const dispersionApi = new RainbowFetchClient({
  // baseURL: 'https://metadata.p.rainbow.me',
  // TODO: revert this
  baseURL: 'https://dispersion-chris.api.p.rainbow.me',
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

export const getUniswapV2Tokens = async (
  addresses: EthereumAddress[]
): Promise<RainbowToken[]> => {
  const res = await dispersionApi.post('/dispersion/v1/tokens/uniswap/v2', {
    addresses,
  });
  return res?.data?.tokens;
};
