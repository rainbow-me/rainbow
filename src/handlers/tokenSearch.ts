import { isAddress } from '@ethersproject/address';
import qs from 'query-string';
import { create } from 'gretchen';
import {
  TokenSearchThreshold,
  TokenSearchTokenListId,
  TokenSearchUniswapAssetKey,
} from '@/entities';
import { logger, RainbowError } from '@/logger';
import { EthereumAddress } from '@rainbow-me/swaps';

const tokenSearchApi = create({
  baseURL: 'https://token-search.rainbow.me/v2',
  timeout: 30000,
});

export const tokenSearch = async (searchParams: {
  chainId: number;
  fromChainId?: number | '';
  keys: TokenSearchUniswapAssetKey[];
  list: TokenSearchTokenListId;
  threshold: TokenSearchThreshold;
  query: string;
}) => {
  const queryParams: {
    keys: TokenSearchUniswapAssetKey[];
    list: TokenSearchTokenListId;
    threshold: TokenSearchThreshold;
    query?: string;
    fromChainId?: number;
  } = {
    keys: searchParams.keys,
    list: searchParams.list,
    threshold: searchParams.threshold,
    query: searchParams.query,
  };
  if (searchParams.fromChainId) {
    queryParams.fromChainId = searchParams.fromChainId;
  }
  try {
    if (isAddress(searchParams.query) && !searchParams.fromChainId) {
      // @ts-ignore
      params.keys = `networks.${params.chainId}.address`;
    }
    const url = `/${searchParams.chainId}/?${qs.stringify(queryParams)}`;
    const tokenSearch = await tokenSearchApi(url).json();
    return tokenSearch.data?.data;
  } catch (e: any) {
    logger.error(
      new RainbowError(`An error occurred while searching for query`),
      {
        query: searchParams.query,
        message: e.message,
      }
    );
  }
};

export const walletFilter = async (params: {
  addresses: EthereumAddress[];
  fromChainId: number;
  toChainId: number;
}) => {
  try {
    const { addresses, fromChainId, toChainId } = params;
    const filteredAddresses = await tokenSearchApi(`/${fromChainId}`, {
      method: 'POST',
      json: {
        addresses,
        toChainId,
      },
    }).json();
    return filteredAddresses?.data?.data || [];
  } catch (e: any) {
    logger.error(
      new RainbowError(`An error occurred while filter wallet addresses`),
      {
        toChainId: params.toChainId,
        fromChainId: params.fromChainId,
        message: e.message,
      }
    );
    throw e;
  }
};
