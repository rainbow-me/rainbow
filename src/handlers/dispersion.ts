import { create } from 'gretchen';
import { EthereumAddress, IndexToken, RainbowToken } from '@/entities';
import UniswapAssetsCache from '@/utils/uniswapAssetsCache';
import { logger, RainbowError } from '@/logger';

const dispersionApi = create({
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
      const res = await dispersionApi('/dispersion/v1/tokens/uniswap/v2', {
        method: 'POST',
        json: {
          addresses,
        },
      }).json();
      UniswapAssetsCache.cache[key] = res?.data?.tokens;
      return res?.data?.tokens ?? null;
    }
  } catch (e: any) {
    logger.error(new RainbowError(`Error fetching uniswap v2 tokens`), {
      message: e.message,
    });
  }
  return null;
};

export const getDPIBalance = async (): Promise<{
  base: IndexToken;
  underlying: IndexToken[];
} | null> => {
  try {
    const res = await dispersionApi('/dispersion/v1/dpi').json();
    return res?.data?.data ?? null;
  } catch (e: any) {
    logger.error(new RainbowError(`Error fetching dpi balance`), {
      message: e.message,
    });
    return null;
  }
};

export const getTrendingAddresses = async (): Promise<
  EthereumAddress[] | null
> => {
  try {
    const res = await dispersionApi('/dispersion/v1/trending').json();
    return res?.data?.data?.trending ?? null;
  } catch (e: any) {
    logger.error(new RainbowError(`Error fetching trending addresses`), {
      message: e.message,
    });
    return null;
  }
};

export const getAdditionalAssetData = async (
  address: EthereumAddress,
  chainId = 1
) => {
  try {
    const res = await dispersionApi(
      `/dispersion/v1/expanded/${chainId}/${address}`
    ).json();
    return res?.data?.data ?? null;
  } catch (e: any) {
    logger.error(new RainbowError(`Error fetching additional asset data`), {
      message: e.message,
    });
    return null;
  }
};
