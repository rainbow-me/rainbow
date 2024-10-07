import { TokenSearchResult, useTokenSearch } from '@/resources/search/search';
import { AddressOrEth, ExtendedAnimatedAssetWithColors } from '@/components/swaps/types/assets';
import { ChainId } from '@/chains/types';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/components/swaps/types/search';
import { addHexPrefix } from '@/handlers/web3';
import { isLowerCaseMatch, filterList } from '@/utils';
import { getStandardizedUniqueIdWorklet } from '@/components/swaps/utils/swaps';
import { useFavorites } from '@/resources/favorites';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { runOnJS, SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { TokenToBuyListItem } from '@/components/swaps/TokenToBuyList';
import { RecentSwap } from '@/components/swaps/types/swap';
import { useTokenDiscovery } from '@/resources/search';
import { fetchSuggestions } from '@/handlers/ens';
import { noop } from 'lodash';

export type AssetToBuySectionId = 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks' | 'popular' | 'profiles';

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
}): SearchAsset[] => assets?.filter(curatedAsset => !isLowerCaseMatch(curatedAsset?.address, filteredBridgeAssetAddress ?? '')) || [];

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
    profiles: Awaited<ReturnType<typeof fetchSuggestions>>;
  };
  favoritesList: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
}): TokenToBuyListItem[] => {
  const formattedData: TokenToBuyListItem[] = [];

  const addSection = (id: AssetToBuySectionId, data: SearchAsset[], listItemType: 'coinRow' | 'profileRow' = 'coinRow') => {
    if (data.length > 0) {
      formattedData.push({ listItemType: 'header', id, data });
      // @ts-expect-error - ens profiles doesn't match the SearchAsset type
      data.forEach(item => formattedData.push({ ...item, sectionId: id, listItemType }));
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

  if (combinedData.profiles?.length) {
    // @ts-expect-error - ens profiles doesn't match the SearchAsset type
    addSection('profiles', combinedData.profiles, 'profileRow');
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

type State = {
  fromChainId: ChainId | undefined;
  isCrosschainSearch: boolean;
  toChainId: ChainId;
  profiles: Awaited<ReturnType<typeof fetchSuggestions>>;
};

export function useSearchCurrencyLists({
  assetToSell,
  selectedOutputChainId,
  searchQuery,
  searchProfiles = false,
}: {
  assetToSell: ExtendedAnimatedAssetWithColors | null;
  selectedOutputChainId: SharedValue<ChainId>;
  searchQuery: string;
  searchProfiles?: boolean;
}) {
  const getRecentSwapsByChain = useSwapsStore(state => state.getRecentSwapsByChain);

  const [state, setState] = useState<State>({
    fromChainId: assetToSell ? assetToSell.chainId ?? ChainId.mainnet : undefined,
    isCrosschainSearch: assetToSell ? assetToSell.chainId !== selectedOutputChainId.value : false,
    toChainId: selectedOutputChainId.value ?? ChainId.mainnet,
    profiles: [],
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
      isCrosschainSearch: assetToSell ? assetToSell.chainId !== selectedOutputChainId.value : false,
      toChainId: selectedOutputChainId.value ?? ChainId.mainnet,
    }),
    (current, previous) => {
      const toChainIdChanged = previous && current.toChainId !== previous.toChainId;
      const isCrosschainSearchChanged = previous && current.isCrosschainSearch !== previous.isCrosschainSearch;

      if (!toChainIdChanged && !isCrosschainSearchChanged) return;

      const newState = {
        fromChainId: assetToSell ? assetToSell.chainId ?? ChainId.mainnet : undefined,
        isCrosschainSearch: current.isCrosschainSearch,
        toChainId: current.toChainId,
        profiles: [],
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
        const isMatch = isCurrentNetwork && (hasIcon || searchQuery.length > 2);

        if (!isMatch) {
          const crosschainMatch = getExactMatches([asset], searchQuery);
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
    [searchQuery, state.toChainId]
  );

  const { data: verifiedAssets, isFetching: isLoadingVerifiedAssets } = useTokenSearch(
    {
      list: 'verifiedAssets',
      chainId: isAddress(searchQuery) ? state.toChainId : undefined,
      keys: isAddress(searchQuery) ? ['address'] : ['name', 'symbol'],
      threshold: isAddress(searchQuery) ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS',
      query: searchQuery.length > 0 ? searchQuery : undefined,
    },
    {
      select: selectTopSearchResults,
      staleTime: 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 10000,
    }
  );

  const { data: popularAssets, isFetching: isLoadingPopularAssets } = useTokenDiscovery({ chainId: state.toChainId });

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
        uniqueId: getStandardizedUniqueIdWorklet({
          address: (favToken.networks[state.toChainId]?.address || favToken.address) as AddressOrEth,
          chainId: state.toChainId,
        }),
      })) as SearchAsset[];
  }, [favorites, state.toChainId]);

  const memoizedData = useMemo(() => {
    const queryIsAddress = isAddress(searchQuery);
    const keys: TokenSearchAssetKey[] = queryIsAddress ? ['address'] : ['name', 'symbol'];
    const threshold: TokenSearchThreshold = queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    const enableUnverifiedSearch = searchQuery.length > 2;

    const inputAssetBridgedToSelectedChainAddress = assetToSell?.networks?.[selectedOutputChainId.value]?.address;

    const bridgeAsset =
      state.isCrosschainSearch && inputAssetBridgedToSelectedChainAddress
        ? verifiedAssets?.find(
            asset => asset.address === inputAssetBridgedToSelectedChainAddress && asset.chainId === selectedOutputChainId.value
          )
        : null;

    const filteredBridgeAsset = bridgeAsset && filterBridgeAsset({ asset: bridgeAsset, filter: searchQuery }) ? bridgeAsset : null;

    return {
      queryIsAddress,
      keys,
      threshold,
      enableUnverifiedSearch,
      filteredBridgeAsset,
    };
  }, [assetToSell, searchQuery, selectedOutputChainId, state, verifiedAssets]);

  const recentsForChain = useMemo(() => {
    return filterList(getRecentSwapsByChain(state.toChainId), searchQuery, memoizedData.keys, {
      threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      sorter: matchItems => matchItems.sort((a, b) => b.item.swappedAt - a.item.swappedAt),
    });
  }, [getRecentSwapsByChain, state.toChainId, searchQuery, memoizedData.keys, memoizedData.queryIsAddress]);

  const popularAssetsForChain = useMemo(() => {
    if (!popularAssets) return [];
    if (!searchQuery) return popularAssets;
    return filterList(popularAssets, searchQuery, memoizedData.keys, {
      threshold: memoizedData.queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }, [popularAssets, searchQuery, memoizedData.keys, memoizedData.queryIsAddress]);

  const profiles = useMemo(async () => {
    if (!searchProfiles) return [];
    return await fetchSuggestions(searchQuery, noop, noop, searchProfiles);
  }, [searchProfiles, searchQuery]);

  const favoritesList = useMemo(() => {
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

  const { data: unverifiedAssets, isFetching: isLoadingUnverifiedAssets } = useTokenSearch(
    {
      chainId: state.toChainId,
      keys: isAddress(searchQuery) ? ['address'] : ['name', 'symbol'],
      list: 'highLiquidityAssets',
      threshold: isAddress(searchQuery) ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS',
      query: searchQuery.length > 0 ? searchQuery : undefined,
    },
    {
      enabled: memoizedData.enableUnverifiedSearch,
      select: (data: TokenSearchResult) => {
        return getExactMatches(data, searchQuery).slice(0, MAX_UNVERIFIED_RESULTS);
      },
    }
  );

  useEffect(() => {
    if (searchProfiles) {
      profiles.then(results => {
        if (results.length) {
          debouncedStateSet(prev => ({ ...prev, profiles: results }));
        } else {
          debouncedStateSet(prev => ({ ...prev, profiles: [] }));
        }
      });
    }
  }, [debouncedStateSet, profiles, searchProfiles]);

  return useMemo(() => {
    const toChainId = selectedOutputChainId.value ?? ChainId.mainnet;
    const bridgeResult = memoizedData.filteredBridgeAsset ?? undefined;
    const crosschainMatches = searchQuery === '' ? undefined : verifiedAssets?.filter(asset => asset.chainId !== toChainId);
    const verifiedResults = searchQuery === '' ? verifiedAssets : verifiedAssets?.filter(asset => asset.chainId === toChainId);
    const unverifiedResults = memoizedData.enableUnverifiedSearch ? unverifiedAssets : undefined;

    return {
      results: buildListSectionsData({
        combinedData: {
          bridgeAsset: bridgeResult,
          crosschainExactMatches: crosschainMatches,
          unverifiedAssets: unverifiedResults,
          verifiedAssets: verifiedResults,
          recentSwaps: recentsForChain,
          popularAssets: popularAssetsForChain,
          profiles: state.profiles,
        },
        favoritesList,
        filteredBridgeAssetAddress: memoizedData.filteredBridgeAsset?.address,
      }),
      isLoading: isLoadingVerifiedAssets || isLoadingUnverifiedAssets || isLoadingPopularAssets,
    };
  }, [
    selectedOutputChainId,
    memoizedData.filteredBridgeAsset,
    memoizedData.enableUnverifiedSearch,
    searchQuery,
    verifiedAssets,
    unverifiedAssets,
    recentsForChain,
    popularAssetsForChain,
    state.profiles,
    favoritesList,
    isLoadingVerifiedAssets,
    isLoadingUnverifiedAssets,
    isLoadingPopularAssets,
  ]);
}
