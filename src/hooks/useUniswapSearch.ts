import { useCallback } from 'react';
import { RainbowFetchClient } from '../rainbow-fetch';
import { RainbowToken } from '@rainbow-me/entities';
import { addHexPrefix } from '@rainbow-me/handlers/web3';
import logger from 'logger';

type Threshold = 'CONTAINS' | 'CASE_SENSITIVE_EQUAL';
type TokenListId =
  | 'highLiquidityAssets'
  | 'lowLiquidityAssets'
  | 'verifiedAssets';
type UniswapAssetKey = keyof RainbowToken;

const tokenSearchApi = new RainbowFetchClient({
  baseURL: 'http://127.0.0.1:8787',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const uniswapSearch = async (
  list: TokenListId,
  query: string,
  keys: UniswapAssetKey[],
  threshold: Threshold
) => {
  try {
    const tokenSearch = await tokenSearchApi.post('', {
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

export default () =>
  useCallback(async (searchList: TokenListId, query: string) => {
    const isAddress = query.match(/^(0x)?[0-9a-fA-F]{40}$/);
    if (isAddress) {
      const formattedQuery = addHexPrefix(query).toLowerCase();
      return uniswapSearch(
        searchList,
        formattedQuery,
        ['address'],
        'CASE_SENSITIVE_EQUAL'
      );
    }
    return uniswapSearch(searchList, query, ['symbol', 'name'], 'CONTAINS');
  }, []);
