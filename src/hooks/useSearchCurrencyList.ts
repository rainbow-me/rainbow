import lang from 'i18n-js';
import { rankings } from 'match-sorter';
import { useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { addHexPrefix } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import { filterList } from '@/utils';
import { IS_TEST } from '@/env';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useTokenSearchAllNetworks } from '@/__swaps__/screens/Swap/resources/search/search';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { isAddress } from '@ethersproject/address';

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

  // TODO JIN - consolidate this shit below
  // TODO JIN - remove the list param
  const { data: verifiedAssets, isFetching: loading } = useTokenSearchAllNetworks(
    {
      list: 'verifiedAssets',
      query: searchQuery,
    },
    {
      staleTime: 10 * 60 * 1_000, // 10 min
    }
  );

  const { data: highLiquidityAssets } = useTokenSearchAllNetworks(
    {
      list: 'highLiquidityAssets',
      query: searchQuery,
    },
    {
      staleTime: 10 * 60 * 1_000, // 10 min
    }
  );

  const { data: lowLiquidityAssets } = useTokenSearchAllNetworks(
    {
      list: 'lowLiquidityAssets',
      query: searchQuery,
    },
    {
      staleTime: 10 * 60 * 1_000, // 10 min
    }
  );

  // TODO JIN - update this and split up the results above
  const currencyList = useMemo(() => {
    const list = [];

    if (searching) {
      let verifiedAssetsWithImport = verifiedAssets;
      let highLiquidityAssetsWithImport = highLiquidityAssets;
      let lowLiquidityAssetsWithoutImport = lowLiquidityAssets;

      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'favorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
      if (verifiedAssetsWithImport?.length) {
        list.push({
          data: verifiedAssetsWithImport,
          key: 'verified',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.verifiedTokenSection}`),
          useGradientText: !IS_TEST,
        });
      }
      if (highLiquidityAssetsWithImport?.length) {
        list.push({
          data: highLiquidityAssetsWithImport,
          key: 'highLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.unverifiedTokenSection}`),
        });
      }
      if (lowLiquidityAssetsWithoutImport?.length) {
        list.push({
          data: lowLiquidityAssetsWithoutImport,
          key: 'lowLiquidity',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.lowLiquidityTokenSection}`),
        });
      }
    } else {
      if (unfilteredFavorites?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(unfilteredFavorites, 'name'),
          key: 'unfilteredFavorites',
          title: lang.t(`exchange.token_sections.${tokenSectionTypes.favoriteTokenSection}`),
        });
      }
    }
    return list;
  }, [verifiedAssets, searching, highLiquidityAssets, lowLiquidityAssets, favoriteAssets, colors.yellowFavorite, unfilteredFavorites]);

  return {
    swapCurrencyList: currencyList,
    swapCurrencyListLoading: loading,
  };
};

export default useSearchCurrencyList;
