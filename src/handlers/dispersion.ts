import { captureException } from '@sentry/react-native';
import { RainbowFetchClient } from '../rainbow-fetch';
import {
  EthereumAddress,
  IndexToken,
  RainbowToken,
  UniswapPoolData,
} from '@rainbow-me/entities';
import UniswapAssetsCache from '@rainbow-me/utils/uniswapAssetsCache';
import logger from 'logger';

const dispersionApi = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const getUniswapV2Pools = async (
  token?: EthereumAddress
): Promise<UniswapPoolData[] | null> => {
  try {
    const tokenPath = token ? `/${token}` : '';
    const res = await dispersionApi.get(
      `/dispersion/v1/pools/uniswap/v2${tokenPath}`
    );
    return res?.data?.pools ?? null;
  } catch (error) {
    logger.sentry(`Error fetching uniswap v2 pools: ${error}`);
    captureException(error);
  }
  return null;
};

export const getUniswapV2Tokens = async (
  addresses: EthereumAddress[]
): Promise<Record<EthereumAddress, RainbowToken> | null> => {
  try {
    const key = addresses.join(',');
    if (UniswapAssetsCache.cache[key]) {
      return UniswapAssetsCache.cache[key];
    } else {
      const res = await dispersionApi.post('/dispersion/v1/tokens/uniswap/v2', {
        addresses,
      });
      UniswapAssetsCache.cache[key] = res?.data?.tokens;
      return res?.data?.tokens ?? null;
    }
  } catch (error) {
    logger.sentry(`Error fetching uniswap v2 tokens: ${error}`);
    captureException(error);
  }
  return null;
};

export const getDPIBalance = async (): Promise<{
  base: IndexToken;
  underlying: IndexToken[];
} | null> => {
  try {
    const res = await dispersionApi.get('/dispersion/v1/dpi');
    return res?.data?.data ?? null;
  } catch (error) {
    logger.sentry(`Error fetching dpi balance: ${error}`);
    captureException(error);
    return null;
  }
};

export const getTrendingAddresses = async (): Promise<
  EthereumAddress[] | null
> => {
  try {
    const res = await dispersionApi.get('/dispersion/v1/trending');
    return res?.data?.data?.trending ?? null;
  } catch (error) {
    logger.sentry(`Error fetching trending addresses: ${error}`);
    captureException(error);
    return null;
  }
};

export const getAdditionalAssetData = async (address: EthereumAddress) => {
  try {
    const res = await dispersionApi.get(`/dispersion/v1/expanded/${address}`);
    return res?.data?.data;
  } catch (error) {
    logger.sentry(`Error fetching additional asset data: ${error}`);
    captureException(error);
  }
};

export const getCoingeckoIds = async (): Promise<
  Record<EthereumAddress, string> | undefined
> => {
  try {
    const res = await dispersionApi.get('/dispersion/v1/coingecko/ids');
    return res?.data?.data?.ids;
  } catch (error) {
    logger.sentry(`Error fetching coingecko ids: ${error}`);
    captureException(error);
  }
};
