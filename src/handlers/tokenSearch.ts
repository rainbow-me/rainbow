import { isAddress } from '@ethersproject/address';
import { qs } from 'url-parse';
import { RainbowFetchClient } from '../rainbow-fetch';
import {
  TokenSearchThreshold,
  TokenSearchTokenListId,
  TokenSearchUniswapAssetKey,
} from '@/entities';
import logger from '@/utils/logger';

const tokenSearchApi = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const tokenSearch = async (searchParams: {
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
    const tokenSearch = await tokenSearchApi.get(url);
    return tokenSearch.data?.data;
  } catch (e) {
    logger.error(
      `An error occurred while searching for query: ${searchParams.query}.`,
      e
    );
  }
};

export default tokenSearch;
