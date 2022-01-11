import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, RainbowToken } from '@rainbow-me/entities';
import UniswapAssetsCache from '@rainbow-me/utils/uniswapAssetsCache';

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

export const getUniswapV2Tokens = async (
  addresses: EthereumAddress[]
): Promise<RainbowToken[]> => {
  const key = addresses.join(',');
  if (UniswapAssetsCache.cache[key]) {
    return UniswapAssetsCache.cache[key];
  } else {
    const res = await dispersionApi.post('/dispersion/v1/tokens/uniswap/v2', {
      addresses,
    });
    UniswapAssetsCache.cache[key] = [...res?.data?.tokens];
    return res?.data?.tokens;
  }
};
