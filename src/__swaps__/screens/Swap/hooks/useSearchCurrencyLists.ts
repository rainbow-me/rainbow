import { TokenSearchResult, useTokenSearch } from '@/__swaps__/screens/Swap/resources/search/search';
import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { addHexPrefix } from '@/handlers/web3';
import { isLowerCaseMatch, filterList } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useFavorites } from '@/resources/favorites';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { TokenToBuyListItem } from '../components/TokenList/TokenToBuyList';
import { useSwapContext } from '../providers/swap-provider';
import { RecentSwap } from '@/__swaps__/types/swap';
import { useTokenDiscovery } from '../resources/search';
import { analyticsV2 } from '@/analytics';

export type AssetToBuySectionId = 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks' | 'popular';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const MAX_UNVERIFIED_RESULTS = 8;
const MAX_VERIFIED_RESULTS = 48;
const MAX_POPULAR_RESULTS = 3;

const mergeAssetsFavoriteStatus = ({
  assets,
  favoritesList,
}: {
  assets: SearchAsset[] | undefined;
  favoritesList: SearchAsset[] | undefined;
}): SearchAsset[] => assets?.map(asset => ({ ...asset, favorite: favoritesList?.some(fav => fav.address === asset.address) })) || [];

const filterAssetsFromBridge = ({
  assets,
  filteredBridgeAssetAddress,
}: {
  assets: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
}): SearchAsset[] => assets?.filter(curatedAsset => !isLowerCaseMatch(curatedAsset?.address, filteredBridgeAssetAddress)) || [];

const filterAssetsFromRecentSwaps = ({
  assets,
  recentSwaps,
}: {
  assets: SearchAsset[] | undefined;
  recentSwaps: RecentSwap[] | undefined;
}): SearchAsset[] => (assets || []).filter(asset => !recentSwaps?.some(recent => recent.address === asset.address));

const filterAssetsFromPopularAssets = ({
  assets,
  popularAssets,
}: {
  assets: SearchAsset[] | undefined;
  popularAssets: SearchAsset[] | undefined;
}): SearchAsset[] => (assets || []).filter(asset => !popularAssets?.some(popular => popular.address === asset.address));

const filterAssetsFromBridgeAndRecent = ({
  assets,
  recentSwaps,
  filteredBridgeAssetAddress,
}: {
  assets: SearchAsset[] | undefined;
  recentSwaps: RecentSwap[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
}): SearchAsset[] =>
  filterAssetsFromRecentSwaps({
    assets: filterAssetsFromBridge({ assets, filteredBridgeAssetAddress }),
    recentSwaps: recentSwaps,
  });

const filterAssetsFromBridgeAndRecentAndPopular = ({
  assets,
  recentSwaps,
  popularAssets,
  filteredBridgeAssetAddress,
}: {
  assets: SearchAsset[] | undefined;
  recentSwaps: RecentSwap[] | undefined;
  popularAssets: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
}): SearchAsset[] =>
  filterAssetsFromPopularAssets({
    assets: filterAssetsFromRecentSwaps({
      assets: filterAssetsFromBridge({ assets, filteredBridgeAssetAddress }),
      recentSwaps: recentSwaps,
    }),
    popularAssets,
  });

const filterAssetsFromFavoritesAndBridgeAndRecentAndPopular = ({
  assets,
  favoritesList,
  filteredBridgeAssetAddress,
  recentSwaps,
  popularAssets,
}: {
  assets: SearchAsset[] | undefined;
  favoritesList: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
  recentSwaps: RecentSwap[] | undefined;
  popularAssets: SearchAsset[] | undefined;
}): SearchAsset[] =>
  filterAssetsFromPopularAssets({
    assets: filterAssetsFromRecentSwaps({
      assets: filterAssetsFromBridge({ assets, filteredBridgeAssetAddress }),
      recentSwaps: recentSwaps,
    }),
    popularAssets,
  })?.filter(
    curatedAsset => !favoritesList?.some(({ address }) => curatedAsset.address === address || curatedAsset.mainnetAddress === address)
  ) || [];

const filterBridgeAsset = ({ asset, filter = '' }: { asset: SearchAsset | null | undefined; filter: string }) =>
  filter.length === 0 ||
  asset?.address?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.name?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.symbol?.toLowerCase()?.startsWith(filter?.toLowerCase());

const buildListSectionsData = ({
  combinedData,
  favoritesList,
  filteredBridgeAssetAddress,
}: {
  combinedData: {
    bridgeAsset?: SearchAsset;
    verifiedAssets?: SearchAsset[];
    unverifiedAssets?: SearchAsset[];
    crosschainExactMatches?: SearchAsset[];
    recentSwaps?: RecentSwap[];
    popularAssets?: SearchAsset[];
  };
  favoritesList: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
}): TokenToBuyListItem[] => {
  const formattedData: TokenToBuyListItem[] = [];

  const addSection = (id: AssetToBuySectionId, assets: SearchAsset[]) => {
    if (assets.length > 0) {
      formattedData.push({ listItemType: 'header', id, data: assets });
      assets.forEach(item => formattedData.push({ ...item, sectionId: id, listItemType: 'coinRow' }));
    }
  };

  if (combinedData.bridgeAsset) {
    addSection(
      'bridge',
      mergeAssetsFavoriteStatus({
        assets: [combinedData.bridgeAsset],
        favoritesList,
      })
    );
  }

  if (combinedData.recentSwaps?.length) {
    const filteredRecents = filterAssetsFromBridge({
      assets: combinedData.recentSwaps,
      filteredBridgeAssetAddress,
    });

    addSection(
      'recent',
      mergeAssetsFavoriteStatus({
        assets: filteredRecents,
        favoritesList,
      })
    );
  }

  if (combinedData.popularAssets?.length) {
    const filteredPopular = filterAssetsFromBridgeAndRecent({
      assets: combinedData.popularAssets,
      recentSwaps: combinedData.recentSwaps,
      filteredBridgeAssetAddress,
    }).slice(0, MAX_POPULAR_RESULTS);
    addSection(
      'popular',
      mergeAssetsFavoriteStatus({
        assets: filteredPopular,
        favoritesList,
      })
    );
  }

  if (favoritesList?.length) {
    const filteredFavorites = filterAssetsFromBridgeAndRecentAndPopular({
      assets: favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
      popularAssets: combinedData.popularAssets,
    });
    addSection('favorites', filteredFavorites);
  }

  if (combinedData.verifiedAssets?.length) {
    const filteredVerified = filterAssetsFromFavoritesAndBridgeAndRecentAndPopular({
      assets: combinedData.verifiedAssets,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
      popularAssets: combinedData.popularAssets,
    });
    addSection('verified', filteredVerified);
  }

  if (!formattedData.length && combinedData.crosschainExactMatches?.length) {
    const filteredCrosschain = filterAssetsFromFavoritesAndBridgeAndRecentAndPopular({
      assets: combinedData.crosschainExactMatches,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
      popularAssets: combinedData.popularAssets,
    });
    addSection('other_networks', filteredCrosschain);
  }

  if (combinedData.unverifiedAssets?.length) {
    const filteredUnverified = filterAssetsFromFavoritesAndBridgeAndRecentAndPopular({
      assets: combinedData.unverifiedAssets,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
      popularAssets: combinedData.popularAssets,
    });
    addSection('unverified', filteredUnverified);
  }

  return formattedData;
};

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

export function useSearchCurrencyLists() {
  const { internalSelectedInputAsset: assetToSell, selectedOutputChainId } = useSwapContext();

  const query = useSwapsStore(state => state.outputSearchQuery.trim().toLowerCase());
  const getRecentSwapsByChain = useSwapsStore(state => state.getRecentSwapsByChain);

  const [state, setState] = useState({
    fromChainId: assetToSell.value ? assetToSell.value.chainId ?? ChainId.mainnet : undefined,
    isCrosschainSearch: assetToSell.value ? assetToSell.value.chainId !== selectedOutputChainId.value : false,
    toChainId: selectedOutputChainId.value ?? ChainId.mainnet,
  });

  // Delays the state set by a frame or two to give animated UI that responds to selectedOutputChainId.value
  // a moment to update before the heavy re-renders kicked off by these state changes occur. This is used
  // when the user changes the selected chain in the output token list.
  const debouncedStateSet = useDebouncedCallback(setState, 20, { leading: false, trailing: true });

  // This is used when the input asset is changed. To avoid a heavy re-render while the input bubble is collapsing,
  // we use a longer delay as in this case the list is not visible, so it doesn't need to react immediately.
  const changedInputAssetStateSet = useDebouncedCallback(setState, 600, { leading: false, trailing: true });

  useAnimatedReaction(
    () => ({
      isCrosschainSearch: assetToSell.value ? assetToSell.value.chainId !== selectedOutputChainId.value : false,
      toChainId: selectedOutputChainId.value ?? ChainId.mainnet,
    }),
    (current, previous) => {
      const toChainIdChanged = previous && current.toChainId !== previous.toChainId;
      const isCrosschainSearchChanged = previous && current.isCrosschainSearch !== previous.isCrosschainSearch;

      if (!toChainIdChanged && !isCrosschainSearchChanged) return;

      const newState = {
        fromChainId: assetToSell.value ? assetToSell.value.chainId ?? ChainId.mainnet : undefined,
        isCrosschainSearch: current.isCrosschainSearch,
        toChainId: current.toChainId,
      };

      if (toChainIdChanged) runOnJS(debouncedStateSet)(newState);
      else if (isCrosschainSearchChanged) runOnJS(changedInputAssetStateSet)(newState);
    },
    []
  );

  const selectTopSearchResults = useCallback(
    (data: TokenSearchResult) => {
      const results = data.filter(asset => {
        const isCurrentNetwork = asset.chainId === state.toChainId;
        const hasIcon = asset.icon_url;
        const isMatch = isCurrentNetwork && (hasIcon || query.length > 2);

        if (!isMatch) {
          const crosschainMatch = getExactMatches([asset], query);
          return crosschainMatch.length > 0;
        }

        return isMatch;
      });

      const crosschainResults = results.filter(asset => asset.chainId !== state.toChainId);
      const topResults = results
        .filter(asset => asset.chainId === state.toChainId)
        .sort((a, b) => {
          if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
          if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
          return Object.keys(b.networks).length - Object.keys(a.networks).length;
        })
        .slice(0, MAX_VERIFIED_RESULTS);

      return [...topResults, ...crosschainResults];
    },
    [query, state.toChainId]
  );

  const { data: verifiedAssets, isLoading: isLoadingVerifiedAssets } = useTokenSearch(
    {
      list: 'verifiedAssets',
      chainId: state.toChainId,
      keys: isAddress(query) ? ['address'] : ['name', 'symbol'],
      threshold: isAddress(query) ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS',
      query: query.length > 0 ? query : undefined,
    },
    {
      select: selectTopSearchResults,
      staleTime: 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 10000,
    }
  );

  const { data: popularAssets, isLoading: isLoadingPopularAssets } = useTokenDiscovery({ chainId: state.toChainId });

  const { favoritesMetadata: favorites } = useFavorites();

  const unfilteredFavorites = useMemo(() => {
    return Object.values(favorites)
      .filter(token => token.networks[state.toChainId])
      .map(favToken => ({
        ...favToken,
        address: favToken.networks?.[state.toChainId]?.address || favToken.address,
        chainId: state.toChainId,
        favorite: true,
        mainnetAddress: favToken.networks?.[ChainId.mainnet]?.address || favToken.mainnet_address,
        uniqueId: getUniqueId(favToken.networks[state.toChainId]?.address || favToken.address, state.toChainId),
      })) as SearchAsset[];
  }, [favorites, state.toChainId]);

  const memoizedData = useMemo(() => {
    const queryIsAddress = isAddress(query);
    const keys: TokenSearchAssetKey[] = queryIsAddress ? ['address'] : ['name', 'symbol'];
    const threshold: TokenSearchThreshold = queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    const enableUnverifiedSearch = query.length > 2;

    const inputAssetBridgedToSelectedChainAddress = assetToSell.value?.networks?.[selectedOutputChainId.value]?.address;

    const bridgeAsset =
      state.isCrosschainSearch && inputAssetBridgedToSelectedChainAddress
        ? verifiedAssets?.find(
            asset => asset.address === inputAssetBridgedToSelectedChainAddress && asset.chainId === selectedOutputChainId.value
          )
        : null;

    const filteredBridgeAsset = bridgeAsset && filterBridgeAsset({ asset: bridgeAsset, filter: query }) ? bridgeAsset : null;

    return {
      queryIsAddress,
      keys,
      threshold,
      enableUnverifiedSearch,
      filteredBridgeAsset,
    };
  }, [assetToSell, query, selectedOutputChainId, state, verifiedAssets]);

  const recentsForChain = useMemo(() => {
    return filterList(getRecentSwapsByChain(state.toChainId), query, memoizedData.keys, {
      threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      sorter: matchItems => matchItems.sort((a, b) => b.item.swappedAt - a.item.swappedAt),
    });
  }, [getRecentSwapsByChain, state.toChainId, query, memoizedData.keys, memoizedData.queryIsAddress]);

  const popularAssetsForChain = useMemo(() => {
    if (!popularAssets) return [];
    if (!query) return popularAssets;
    return filterList(popularAssets, query, memoizedData.keys, {
      threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }, [popularAssets, query, memoizedData.keys, memoizedData.queryIsAddress]);

  const favoritesList = useMemo(() => {
    if (query === '') {
      return unfilteredFavorites;
    } else {
      return filterList(
        unfilteredFavorites || [],
        memoizedData.queryIsAddress ? addHexPrefix(query).toLowerCase() : query,
        memoizedData.keys,
        {
          threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
        }
      );
    }
  }, [memoizedData.keys, memoizedData.queryIsAddress, query, unfilteredFavorites]);

  const { data: unverifiedAssets, isLoading: isLoadingUnverifiedAssets } = useTokenSearch(
    {
      chainId: state.toChainId,
      keys: isAddress(query) ? ['address'] : ['name', 'symbol'],
      list: 'highLiquidityAssets',
      threshold: isAddress(query) ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS',
      query,
    },
    {
      enabled: memoizedData.enableUnverifiedSearch,
      select: (data: TokenSearchResult) => {
        return isAddress(query) ? getExactMatches(data, query).slice(0, MAX_UNVERIFIED_RESULTS) : data.slice(0, MAX_UNVERIFIED_RESULTS);
      },
    }
  );

  const searchCurrencyLists = useMemo(() => {
    const toChainId = selectedOutputChainId.value ?? ChainId.mainnet;
    const bridgeResult = memoizedData.filteredBridgeAsset ?? undefined;
    const crosschainMatches = query === '' ? undefined : verifiedAssets?.filter(asset => asset.chainId !== toChainId);
    const verifiedResults = query === '' ? verifiedAssets : verifiedAssets?.filter(asset => asset.chainId === toChainId);
    const unverifiedResults = memoizedData.enableUnverifiedSearch ? unverifiedAssets : undefined;

    const results = buildListSectionsData({
      combinedData: {
        bridgeAsset: bridgeResult,
        crosschainExactMatches: crosschainMatches,
        unverifiedAssets: unverifiedResults,
        verifiedAssets: verifiedResults,
        recentSwaps: recentsForChain,
        popularAssets: popularAssetsForChain,
      },
      favoritesList,
      filteredBridgeAssetAddress: memoizedData.filteredBridgeAsset?.address,
    });

    const isLoading = isLoadingVerifiedAssets || isLoadingUnverifiedAssets || isLoadingPopularAssets;

    return { results, isLoading };
  }, [
    favoritesList,
    isLoadingUnverifiedAssets,
    isLoadingVerifiedAssets,
    isLoadingPopularAssets,
    memoizedData.enableUnverifiedSearch,
    memoizedData.filteredBridgeAsset,
    query,
    selectedOutputChainId.value,
    unverifiedAssets,
    verifiedAssets,
    recentsForChain,
    popularAssetsForChain,
  ]);

  useEffect(() => {
    if (searchCurrencyLists.isLoading) return;
    const params = { screen: 'swap' as const, total_tokens: 0, no_icon: 0, query };
    for (const assetOrHeader of searchCurrencyLists.results) {
      if (assetOrHeader.listItemType === 'header') continue;
      if (!assetOrHeader.icon_url) params.no_icon += 1;
      params.total_tokens += 1;
    }
    analyticsV2.track(analyticsV2.event.tokenList, params);
  }, [searchCurrencyLists.results, searchCurrencyLists.isLoading, query]);

  return searchCurrencyLists;
}
