import { captureException } from '@sentry/react-native';
import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, IndexToken, RainbowToken } from '@/entities';
import UniswapAssetsCache from '@/utils/uniswapAssetsCache';
import logger from '@/utils/logger';
import { Network } from '@/helpers';

const dispersionApi = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

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

export const getAdditionalAssetData = async (
  address: EthereumAddress,
  chainId = 1
) => {
  try {
    const res = await dispersionApi.get(
      `/dispersion/v1/expanded/${chainId}/${address}`
    );
    return res?.data?.data ?? null;
  } catch (error) {
    logger.sentry(`Error fetching additional asset data: ${error}`);
    captureException(error);
    return null;
  }
};
