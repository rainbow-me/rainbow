import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useEffect, useMemo, useRef } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { analyticsV2 } from '@/analytics';
import { addHexPrefix } from '@/handlers/web3';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import {
  ADDRESS_SEARCH_KEY,
  NAME_SYMBOL_SEARCH_KEYS,
  useSwapsSearchStore,
  useTokenSearchStore,
} from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { AssetToBuySectionId, SearchAsset, TokenToBuyListItem } from '@/__swaps__/types/search';
import { RecentSwap } from '@/__swaps__/types/swap';
import { isLowerCaseMatch, filterList, time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { usePopularTokensStore } from '../resources/search/discovery';

const ANALYTICS_LOG_THROTTLE_MS = time.seconds(5);
const MAX_POPULAR_RESULTS = 3;

export function useSearchCurrencyLists() {
  const lastTrackedTimeRef = useRef<number | null>(null);
  const searchResults = useTokenSearchStore(state => state.getData());
  const popularAssets = usePopularTokensStore(state => state.getData());
  const { favoritesMetadata: favorites } = useFavorites();

  const isCrosschainSearch = useSwapsStore(state =>
    state.inputAsset ? state.inputAsset.chainId !== (state.selectedOutputChainId ?? ChainId.mainnet) : false
  );
  const query = useSwapsSearchStore(state => state.searchQuery.trim().toLowerCase());
  const toChainId = useSwapsStore(state => state.selectedOutputChainId ?? ChainId.mainnet);

  const getRecentSwapsByChain = useSwapsStore(state => state.getRecentSwapsByChain);
  const recentSwaps = useMemo(() => getRecentSwapsByChain(toChainId), [getRecentSwapsByChain, toChainId]);

  const [isContractSearch, keys] = useMemo(() => {
    const isContract = isAddress(query);
    return [isContract, isContract ? ADDRESS_SEARCH_KEY : NAME_SYMBOL_SEARCH_KEYS];
  }, [query]);

  const unfilteredFavorites = useMemo(() => {
    return Object.values(favorites)
      .filter(token => token.networks[toChainId])
      .map(favToken => ({
        ...favToken,
        address: favToken.networks?.[toChainId]?.address || favToken.address,
        chainId: toChainId,
        favorite: true,
        mainnetAddress: favToken.networks?.[ChainId.mainnet]?.address || favToken.mainnet_address,
        uniqueId: getUniqueId(favToken.networks[toChainId]?.address || favToken.address, toChainId),
      })) as SearchAsset[];
  }, [favorites, toChainId]);

  const filteredBridgeAsset = useDeepCompareMemo(() => {
    if (!searchResults?.bridgeAsset) return null;

    const inputAssetBridgedToSelectedChainAddress = useSwapsStore.getState().inputAsset?.networks?.[toChainId]?.address;

    const shouldShowBridgeResult =
      isCrosschainSearch &&
      inputAssetBridgedToSelectedChainAddress &&
      inputAssetBridgedToSelectedChainAddress === searchResults?.bridgeAsset?.networks?.[toChainId]?.address &&
      filterBridgeAsset({ asset: searchResults?.bridgeAsset, filter: query });

    return shouldShowBridgeResult && searchResults.bridgeAsset
      ? {
          ...searchResults.bridgeAsset,
          chainId: toChainId,
          favorite: unfilteredFavorites.some(
            fav =>
              fav.networks?.[toChainId]?.address ===
              (searchResults?.bridgeAsset?.networks?.[toChainId]?.address || inputAssetBridgedToSelectedChainAddress)
          ),
        }
      : null;
  }, [isCrosschainSearch, query, toChainId, unfilteredFavorites, searchResults?.bridgeAsset]);

  const favoritesList = useDeepCompareMemo(() => {
    if (query === '') return unfilteredFavorites;
    else
      return filterList(unfilteredFavorites || [], isContractSearch ? addHexPrefix(query).toLowerCase() : query, keys, {
        threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      });
  }, [isContractSearch, keys, query, unfilteredFavorites]);

  const recentsForChain = useDeepCompareMemo(() => {
    return filterList(recentSwaps, query, keys, {
      threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      sorter: matchItems => matchItems.sort((a, b) => b.item.swappedAt - a.item.swappedAt),
    });
  }, [query, isContractSearch, keys, recentSwaps]);

  const popularAssetsForChain = useDeepCompareMemo(() => {
    if (!popularAssets) return [];
    if (!query) return popularAssets;
    return filterList(popularAssets, query, keys, {
      threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
  }, [isContractSearch, keys, popularAssets, query]);

  const data = useMemo(() => {
    return {
      isLoading: false,
      results: buildListSectionsData({
        combinedData: {
          bridgeAsset: filteredBridgeAsset,
          crosschainExactMatches: searchResults?.crosschainResults,
          popularAssets: popularAssetsForChain,
          recentSwaps: recentsForChain,
          unverifiedAssets: searchResults?.unverifiedAssets,
          verifiedAssets: searchResults?.verifiedAssets,
        },
        favoritesList,
        filteredBridgeAssetAddress: filteredBridgeAsset?.address,
      }),
    };
  }, [
    favoritesList,
    filteredBridgeAsset,
    popularAssetsForChain,
    recentsForChain,
    searchResults?.crosschainResults,
    searchResults?.verifiedAssets,
    searchResults?.unverifiedAssets,
  ]);

  useEffect(() => {
    const query = useSwapsSearchStore.getState().searchQuery.trim();
    const now = Date.now();
    if (
      query.length <= 2 ||
      (lastTrackedTimeRef.current && now - lastTrackedTimeRef.current < ANALYTICS_LOG_THROTTLE_MS) ||
      useTokenSearchStore.getState().status !== 'success'
    ) {
      return;
    }
    lastTrackedTimeRef.current = now;
    const params = { screen: 'swap' as const, total_tokens: 0, no_icon: 0, query };
    for (const assetOrHeader of data.results) {
      if (assetOrHeader.listItemType === 'header') continue;
      if (!assetOrHeader.icon_url) params.no_icon += 1;
      params.total_tokens += 1;
    }
    analyticsV2.track(analyticsV2.event.tokenList, params);
  }, [data.results]);

  return data;
}

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
    bridgeAsset: SearchAsset | null;
    verifiedAssets: SearchAsset[] | undefined;
    unverifiedAssets: SearchAsset[] | undefined;
    crosschainExactMatches: SearchAsset[] | undefined;
    recentSwaps: RecentSwap[] | undefined;
    popularAssets: SearchAsset[] | undefined;
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
