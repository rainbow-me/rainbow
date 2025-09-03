import * as i18n from '@/languages';
import { rankings } from 'match-sorter';
import { useCallback, useMemo } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { addHexPrefix } from '@/handlers/web3';
import tokenSectionTypes from '@/helpers/tokenSectionTypes';
import { filterList } from '@/utils';
import { IS_TEST } from '@/env';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useDiscoverSearchQueryStore, useDiscoverSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { isAddress } from '@ethersproject/address';

const MAX_VERIFIED_RESULTS = 24;
const MAX_HIGH_LIQUIDITY_RESULTS = 6;
const MAX_LOW_LIQUIDITY_RESULTS = 6;

const abcSort = (list: any[], key?: string) => {
  return list.sort((a, b) => {
    return key ? a[key]?.localeCompare(b[key]) : a?.localeCompare(b);
  });
};

const useSearchCurrencyList = () => {
  const searchQuery = useDiscoverSearchQueryStore(state => state.searchQuery.trim().toLowerCase());
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

  const searchResultAssets = useDiscoverSearchStore(state => state.getData());
  const loading = useDiscoverSearchStore(state => state.getStatus().isFetching);

  const removeFavoritesAndEnforceResultsLimit = useCallback(
    (assets: SearchAsset[] | undefined, maxResults: number) => {
      return (assets || []).filter(asset => !favoriteAssets.some(fav => fav.uniqueId === asset.uniqueId)).slice(0, maxResults);
    },
    [favoriteAssets]
  );

  const currencyList = useMemo(() => {
    const list = [];
    const verifiedAssets = removeFavoritesAndEnforceResultsLimit(searchResultAssets?.verifiedAssets, MAX_VERIFIED_RESULTS);
    const highLiquidityAssets = removeFavoritesAndEnforceResultsLimit(searchResultAssets?.highLiquidityAssets, MAX_HIGH_LIQUIDITY_RESULTS);
    const lowLiquidityAssets = removeFavoritesAndEnforceResultsLimit(searchResultAssets?.lowLiquidityAssets, MAX_LOW_LIQUIDITY_RESULTS);

    if (searching) {
      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'favorites',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.favoriteTokenSection]),
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.verifiedTokenSection]),
          useGradientText: !IS_TEST,
        });
      }
      if (highLiquidityAssets?.length) {
        list.push({
          data: highLiquidityAssets,
          key: 'highLiquidity',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.unverifiedTokenSection]),
        });
      }
      if (lowLiquidityAssets?.length) {
        list.push({
          data: lowLiquidityAssets,
          key: 'lowLiquidity',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.lowLiquidityTokenSection]),
        });
      }
    } else {
      if (favoriteAssets?.length) {
        list.push({
          color: colors.yellowFavorite,
          data: abcSort(favoriteAssets, 'name'),
          key: 'unfilteredFavorites',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.favoriteTokenSection]),
        });
      }
      if (verifiedAssets?.length) {
        list.push({
          data: verifiedAssets,
          key: 'verified',
          title: i18n.t((i18n.l.exchange.token_sections as any)[tokenSectionTypes.verifiedTokenSection]),
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
