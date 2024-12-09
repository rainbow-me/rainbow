import { isAddress } from '@ethersproject/address';
import { qs } from 'url-parse';
import { RainbowFetchClient } from '../rainbow-fetch';
import { TokenSearchThreshold, TokenSearchTokenListId } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { RainbowToken, TokenSearchToken } from '@/entities/tokens';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';

const ALL_VERIFIED_TOKENS_PARAM = '/?list=verifiedAssets';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

function parseTokenSearch(assets: TokenSearchToken[]): RainbowToken[] {
  const chainsName = useBackendNetworksStore.getState().getChainsName();
  return assets.map(token => {
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
}

export const tokenSearch = async (searchParams: {
  chainId: ChainId;
  fromChainId?: number | '';
  keys: (keyof RainbowToken)[];
  list: TokenSearchTokenListId;
  threshold: TokenSearchThreshold;
  query: string;
}): Promise<RainbowToken[]> => {
  const queryParams: {
    keys: string;
    list: TokenSearchTokenListId;
    threshold: TokenSearchThreshold;
    query?: string;
    fromChainId?: number;
  } = {
    keys: searchParams.keys.join(','),
    list: searchParams.list,
    threshold: searchParams.threshold,
    query: searchParams.query,
  };

  const { chainId, query } = searchParams;

  const isAddressSearch = query && isAddress(query);

  if (isAddressSearch) {
    queryParams.keys = `networks.${chainId}.address`;
  }

  const url = `/?${qs.stringify(queryParams)}`;
  const isSearchingVerifiedAssets = queryParams.list === 'verifiedAssets';

  try {
    const tokenSearch = await tokenSearchHttp.get<{ data: TokenSearchToken[] }>(url);

    if (isAddressSearch && isSearchingVerifiedAssets) {
      if (tokenSearch && tokenSearch.data.data.length > 0) {
        return parseTokenSearch(tokenSearch.data.data);
      }

      const allVerifiedTokens = await tokenSearchHttp.get<{ data: TokenSearchToken[] }>(ALL_VERIFIED_TOKENS_PARAM);

      const addressQuery = query.trim().toLowerCase();

      const addressMatchesOnOtherChains = allVerifiedTokens.data.data.filter(a =>
        Object.values(a.networks).some(n => n?.address === addressQuery)
      );

      return parseTokenSearch(addressMatchesOnOtherChains);
    }

    if (!tokenSearch.data?.data) {
      return [];
    }

    return parseTokenSearch(tokenSearch.data.data);
  } catch (e: any) {
    logger.error(new RainbowError(`[tokenSearch]: An error occurred while searching for query`), {
      query: searchParams.query,
      message: e.message,
    });

    return [];
  }
};
