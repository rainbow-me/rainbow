import { RainbowFetchClient } from '../rainbow-fetch';
import { EthereumAddress, RainbowToken } from '@/entities';
import UniswapAssetsCache from '@/utils/uniswapAssetsCache';
import { logger, RainbowError } from '@/logger';
import { METADATA_BASE_URL } from 'react-native-dotenv';

let dispersionApi: RainbowFetchClient | undefined;

const getDispersionApi = () => {
  const clientUrl = dispersionApi?.baseURL;
  const baseUrl = METADATA_BASE_URL;
  if (!dispersionApi || clientUrl !== baseUrl) {
    dispersionApi = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }
  return dispersionApi;
};

export const getUniswapV2Tokens = async (addresses: EthereumAddress[]): Promise<Record<EthereumAddress, RainbowToken> | null> => {
  try {
    const key = addresses.join(',');
    if (UniswapAssetsCache.cache[key]) {
      return UniswapAssetsCache.cache[key];
    } else {
      const res = await getDispersionApi().post('/dispersion/v1/tokens/uniswap/v2', {
        addresses,
      });
      UniswapAssetsCache.cache[key] = res?.data?.tokens;
      return res?.data?.tokens ?? null;
    }
  } catch (e: any) {
    logger.error(new RainbowError(`[getUniswapV2Tokens]: error fetching uniswap v2 tokens`), {
      message: e.message,
    });
  }
  return null;
};

export const getTrendingAddresses = async (): Promise<EthereumAddress[] | null> => {
  try {
    const res = await getDispersionApi().get('/dispersion/v1/trending');
    return res?.data?.data?.trending ?? null;
  } catch (e: any) {
    logger.error(new RainbowError(`[getTrendingAddresses]: error fetching trending addresses`), {
      message: e.message,
    });
    return null;
  }
};

export const getAdditionalAssetData = async (address: EthereumAddress, chainId = 1) => {
  try {
    const res = await getDispersionApi().get(`/dispersion/v1/expanded/${chainId}/${address}`);
    return res?.data?.data ?? null;
  } catch (e: any) {
    logger.error(new RainbowError(`[getAdditionalAssetData]: error fetching additional asset data`), {
      message: e.message,
    });
    return null;
  }
};
