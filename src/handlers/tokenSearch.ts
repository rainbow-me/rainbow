import { isAddress } from '@ethersproject/address';
import { qs } from 'url-parse';
import { RainbowFetchClient } from '../rainbow-fetch';
import { TokenSearchThreshold, TokenSearchTokenListId, TokenSearchUniswapAssetKey } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { EthereumAddress } from '@rainbow-me/swaps';
import { RainbowToken, TokenSearchToken } from '@/entities/tokens';
import { chainsName } from '@/chains';

type TokenSearchApiResponse = {
  data: TokenSearchToken[];
};

const tokenSearchApi = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const tokenSearch = async (searchParams: {
  chainId: number;
  fromChainId?: number | '';
  keys: TokenSearchUniswapAssetKey[];
  list: TokenSearchTokenListId;
  threshold: TokenSearchThreshold;
  query: string;
}): Promise<RainbowToken[]> => {
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

  try {
    if (isAddress(searchParams.query)) {
      // @ts-ignore
      params.keys = `networks.${searchParams.chainId}.address`;
    }
    const url = `/?${qs.stringify(queryParams)}`;
    const tokenSearch = await tokenSearchApi.get<TokenSearchApiResponse>(url);
    if (!tokenSearch.data?.data) {
      return [];
    }

    return tokenSearch.data.data.map(token => {
      const networkKeys = Object.keys(token.networks);
      const chainId = Number(networkKeys[0]);
      const network = chainsName[chainId];
      return {
        ...token,
        chainId,
        address: token.networks['1']?.address || token.networks[chainId]?.address,
        network,
        mainnet_address: token.networks['1']?.address,
      };
    });
  } catch (e: any) {
    logger.error(new RainbowError(`[tokenSearch]: An error occurred while searching for query`), {
      query: searchParams.query,
      message: e.message,
    });

    return [];
  }
};
