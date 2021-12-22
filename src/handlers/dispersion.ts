// @ts-ignore
// import { IS_TESTING } from 'react-native-dotenv';
import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, RainbowToken } from '@rainbow-me/entities';
import UniswapAssetsCache from '@rainbow-me/utils/uniswapAssetsCache';
import logger from 'logger';

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
  logger.debug('====>>> getUniswapV2Tokens', addresses);

  const key = addresses.join(',');
  // @ts-ignore
  if (UniswapAssetsCache[key]) {
    // @ts-ignore
    return UniswapAssetsCache[key];
  } else {
    // if (IS_TESTING === 'true') {
    //   return [];
    // }
    const res = await dispersionApi.post('/dispersion/v1/tokens/uniswap/v2', {
      addresses,
    });
    // @ts-ignore
    UniswapAssetsCache[key] = [...res?.data?.tokens];
    return res?.data?.tokens;
  }
};
