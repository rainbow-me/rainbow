import lang from 'i18n-js';
import { rankings } from 'match-sorter';
import { groupBy } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { addHexPrefix } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import { isLowerCaseMatch, filterList } from '@/utils';
import { IS_TEST } from '@/env';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { TokenSearchResult, useTokenSearchAllNetworks } from '@/__swaps__/screens/Swap/resources/search/search';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { isAddress } from '@ethersproject/address';

const MAX_VERIFIED_RESULTS = 48;

const getExactMatches = (data: TokenSearchResult, query: string) => {
  const isQueryAddress = isAddress(query.trim());
  return data.filter(asset => {
    if (isQueryAddress) {
      return !!(asset.address?.toLowerCase() === query.trim().toLowerCase());
    }
    const symbolMatch = isLowerCaseMatch(asset.symbol, query);
    const nameMatch = isLowerCaseMatch(asset.name, query);
    return symbolMatch || nameMatch;
  });
};

const abcSort = (list: any[], key?: string) => {
  return list.sort((a, b) => {
    return key ? a[key]?.localeCompare(b[key]) : a?.localeCompare(b);
  });
};

const useSearchCurrencyList = (searchQuery: string) => {
  const searching = useMemo(() => searchQuery !== '', [searchQuery]);

  const { favoritesMetadata: favoriteMap } = useFavorites();
  const unfilteredFavorites = useMemo(() => {
    return Object.values(favoriteMap)
      .filter(token => token.networks[ChainId.mainnet])
      .map(favToken => ({
        ...favToken,
        favorite: true,
        mainnetAddress: favToken.networks?.[ChainId.mainnet]?.address || favToken.mainnet_address,
        uniqueId: getUniqueId(favToken.address, ChainId.mainnet),
      })) as SearchAsset[];
  }, [favoriteMap]);

  const memoizedData = useMemo(() => {
    const queryIsAddress = isAddress(searchQuery);
    const keys: TokenSearchAssetKey[] = queryIsAddress ? ['address'] : ['name', 'symbol'];
    const threshold: TokenSearchThreshold = queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    const enableUnverifiedSearch = searchQuery.length > 2;

    return {
      queryIsAddress,
      keys,
      threshold,
      enableUnverifiedSearch,
    };
  }, [searchQuery]);

  const favoriteAssets = useMemo(() => {
    if (searchQuery === '') {
      return unfilteredFavorites;
    } else {
      return filterList(
        unfilteredFavorites || [],
        memoizedData.queryIsAddress ? addHexPrefix(searchQuery).toLowerCase() : searchQuery,
        memoizedData.keys,
        {
          threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
        }
      );
    }
  }, [memoizedData.keys, memoizedData.queryIsAddress, searchQuery, unfilteredFavorites]);

  const { colors } = useTheme();

  const selectTopSearchResults = useCallback(
    (data: TokenSearchResult) => {
      const results = data.filter(asset => {
        const hasIcon = asset.icon_url;
        const isMatch = hasIcon || searchQuery.length > 2;

        if (!isMatch) {
          const crosschainMatch = getExactMatches([asset], searchQuery);
          return crosschainMatch.length > 0;
        }

        return isMatch;
      });

      const topResults = results
        .sort((a, b) => {
          if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
          if (a.market?.market_cap?.value !== b.market?.market_cap?.value)
            return (b.market?.market_cap?.value || 0) - (a.market?.market_cap?.value || 0);
          if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
          return Object.keys(b.networks).length - Object.keys(a.networks).length;
        })
        .slice(0, MAX_VERIFIED_RESULTS);

      return [...topResults];
    },
    [searchQuery]
  );

  const { data: searchResultAssets, isFetching: loading } = useTokenSearchAllNetworks(
    {
      query: searchQuery,
    },
    {
      select: selectTopSearchResults,
      staleTime: 10 * 60 * 1_000, // 10 min
    }
  );

  const currencyList = useMemo(() => {
    const list = [];
    const { verifiedAssets, highLiquidityAssets, lowLiquidityAssets } = groupBy(searchResultAssets, searchResult => {
      if (searchResult.isVerified) {
        return 'verifiedAssets';
      } else if (!searchResult.isVerified && searchResult.highLiquidity) {
        return 'highLiquidityAssets';
      } else {
        return 'lowLiquidityAssets';
      }
    });

    if (searching) {
      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'favorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.verifiedTokenSection}`),
          useGradientText: !IS_TEST,
        });
      }
      if (highLiquidityAssets?.length) {
        list.push({
          data: highLiquidityAssets,
          key: 'highLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.unverifiedTokenSection}`),
        });
      }
      if (lowLiquidityAssets?.length) {
        list.push({
          data: lowLiquidityAssets,
          key: 'lowLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.lowLiquidityTokenSection}`),
        });
      }
    } else {
      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'unfilteredFavorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.verifiedTokenSection}`),
          useGradientText: !IS_TEST,
        });
      }
    }
    return list;
  }, [searchResultAssets, searching, favoriteAssets, colors.yellowFavorite]);

  return {
    swapCurrencyList: currencyList,
    swapCurrencyListLoading: loading,
  };
};

export default useSearchCurrencyList;
