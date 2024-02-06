import { isAddress } from '@ethersproject/address';
import { qs } from 'url-parse';
import { RainbowFetchClient } from '../rainbow-fetch';
import { TokenSearchThreshold, TokenSearchTokenListId, TokenSearchUniswapAssetKey } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { EthereumAddress } from '@rainbow-me/swaps';
import { RainbowToken, TokenSearchToken } from '@/entities/tokens';
import ethereumUtils from '@/utils/ethereumUtils';

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

export const swapSearch = async (searchParams: {
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
  } catch (e: any) {
    logger.error(new RainbowError(`An error occurred while searching for query`), {
      query: searchParams.query,
      message: e.message,
    });
  }
};

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
      params.keys = `networks.${params.chainId}.address`;
    }
    const url = `/?${qs.stringify(queryParams)}`;
    const tokenSearch = await tokenSearchApi.get<TokenSearchApiResponse>(url);
    if (!tokenSearch.data?.data) {
      return [];
    }

    return tokenSearch.data.data.map(token => {
      const networkKeys = Object.keys(token.networks);
      const network = ethereumUtils.getNetworkFromChainId(Number(networkKeys[0]));
      return {
        ...token,
        address: token.networks['1']?.address || token.networks[Number(networkKeys[0])]?.address,
        network,
        mainnet_address: token.networks['1']?.address,
      };
    });
  } catch (e: any) {
    logger.error(new RainbowError(`An error occurred while searching for query`), {
      query: searchParams.query,
      message: e.message,
    });

    return [];
  }
};

export const walletFilter = async (params: { addresses: EthereumAddress[]; fromChainId: number; toChainId: number }) => {
  try {
    const { addresses, fromChainId, toChainId } = params;
    const filteredAddresses = await tokenSearchApi.post(`/${fromChainId}`, {
      addresses,
      toChainId,
    });
    return filteredAddresses?.data?.data || [];
  } catch (e: any) {
    logger.error(new RainbowError(`An error occurred while filter wallet addresses`), {
      toChainId: params.toChainId,
      fromChainId: params.fromChainId,
      message: e.message,
    });
    throw e;
  }
};
