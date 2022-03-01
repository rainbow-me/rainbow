import { RainbowFetchClient } from '../rainbow-fetch';
import {
  TokenSearchThreshold,
  TokenSearchTokenListId,
  TokenSearchUniswapAssetKey,
} from '@rainbow-me/entities';
import logger from 'logger';

const tokenSearchApi = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const uniswapSearch = async (
  list: TokenSearchTokenListId,
  query: string,
  keys: TokenSearchUniswapAssetKey[],
  threshold: TokenSearchThreshold
) => {
  try {
    const tokenSearch = await tokenSearchApi.post('/v1', {
      keys,
      list,
      query,
      threshold,
    });
    return tokenSearch.data?.data;
  } catch (e) {
    logger.error(`An error occurred while searching for query: ${query}.`, e);
  }
};

export default uniswapSearch;
