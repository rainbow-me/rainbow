import { qs } from 'url-parse';
import { RainbowFetchClient } from '../rainbow-fetch';
import {
  TokenSearchThreshold,
  TokenSearchTokenListId,
  TokenSearchUniswapAssetKey,
} from '@rainbow-me/entities';
import logger from 'logger';

const tokenSearchApi = new RainbowFetchClient({
  baseURL: 'https://token-search-v2.rainbowdotme.workers.dev',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const tokenSearch = async (
  list: TokenSearchTokenListId,
  query: string,
  chainId: number,
  keys: TokenSearchUniswapAssetKey[],
  threshold: TokenSearchThreshold
) => {
  try {
    const url = `/?${qs.stringify({
      // @ts-ignore
      chainId,
      keys,
      list,
      query,
      threshold,
    })}`;

    const tokenSearch = await tokenSearchApi.get(url);
    return tokenSearch.data?.data;
  } catch (e) {
    logger.error(`An error occurred while searching for query: ${query}.`, e);
  }
};

export default tokenSearch;
