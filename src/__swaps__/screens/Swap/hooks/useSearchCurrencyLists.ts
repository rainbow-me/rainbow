import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useEffect, useMemo } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { analyticsV2 } from '@/analytics';
import { addHexPrefix } from '@/handlers/web3';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import {
  ADDRESS_SEARCH_KEY,
  NAME_SYMBOL_SEARCH_KEYS,
  useSwapsSearchStore,
  useTokenSearchStore,
  useUnverifiedTokenSearchStore,
} from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SearchAsset } from '@/__swaps__/types/search';
import { RecentSwap } from '@/__swaps__/types/swap';
import { isLowerCaseMatch, filterList } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { TokenToBuyListItem } from '../components/TokenList/TokenToBuyList';
import { usePopularTokensStore } from '../resources/search/discovery';

export type AssetToBuySectionId = 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks' | 'popular';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const ANALYTICS_LOG_THROTTLE_MS = time.seconds(5);
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

let lastLogTime: number | null = null;

export function useSearchCurrencyLists() {
  const verifiedAssets = useTokenSearchStore(state => state.getData());
  const bridgeAsset = useTokenSearchStore(state => state.bridgeAsset);
  const unverifiedAssets = useUnverifiedTokenSearchStore(state => state.getData());
  const popularAssets = usePopularTokensStore(state => state.getData());
  const { favoritesMetadata: favorites } = useFavorites();

  const query = useSwapsSearchStore(state => state.searchQuery.trim().toLowerCase());
  const toChainId = useSwapsStore(state => state.selectedOutputChainId ?? ChainId.mainnet);
  const isCrosschainSearch = useSwapsStore(state => (state.inputAsset ? state.inputAsset.chainId !== state.selectedOutputChainId : false));

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

  const filteredBridgeAsset = useMemo(() => {
    const inputAssetBridgedToSelectedChainAddress = useSwapsStore.getState().inputAsset?.networks?.[toChainId]?.address;
    const shouldShowBridgeResult =
      bridgeAsset &&
      inputAssetBridgedToSelectedChainAddress &&
      isCrosschainSearch &&
      filterBridgeAsset({ asset: bridgeAsset, filter: query });

    return (shouldShowBridgeResult && (bridgeAsset.chainId === toChainId ? bridgeAsset : { ...bridgeAsset, chainId: toChainId })) || null;
  }, [bridgeAsset, isCrosschainSearch, query, toChainId]);

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

  const favoritesList = useDeepCompareMemo(() => {
    if (query === '') return unfilteredFavorites;
    else
      return filterList(unfilteredFavorites || [], isContractSearch ? addHexPrefix(query).toLowerCase() : query, keys, {
        threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      });
  }, [isContractSearch, keys, query, unfilteredFavorites]);

  const { crosschainExactMatches, verifiedResults } = useMemo(() => {
    const query = useSwapsSearchStore.getState().searchQuery.trim();
    if (!query.length) return { crosschainExactMatches: undefined, verifiedResults: verifiedAssets };

    return (
      verifiedAssets?.reduce(
        (acc: { crosschainExactMatches: SearchAsset[]; verifiedResults: SearchAsset[] }, asset) => {
          acc[asset.chainId === toChainId ? 'verifiedResults' : 'crosschainExactMatches'].push(asset);
          return acc;
        },
        { crosschainExactMatches: [], verifiedResults: [] }
      ) ?? { crosschainExactMatches: undefined, verifiedResults: undefined }
    );
  }, [toChainId, verifiedAssets]);

  const data = useMemo(() => {
    const bridgeAsset = filteredBridgeAsset ?? undefined;
    return {
      isLoading: false,
      results: buildListSectionsData({
        combinedData: {
          bridgeAsset,
          crosschainExactMatches,
          popularAssets: popularAssetsForChain,
          recentSwaps: recentsForChain,
          unverifiedAssets: unverifiedAssets ?? undefined,
          verifiedAssets: verifiedResults ?? undefined,
        },
        favoritesList,
        filteredBridgeAssetAddress: bridgeAsset?.address,
      }),
    };
  }, [
    crosschainExactMatches,
    favoritesList,
    filteredBridgeAsset,
    popularAssetsForChain,
    recentsForChain,
    unverifiedAssets,
    verifiedResults,
  ]);

  useEffect(() => {
    const query = useSwapsSearchStore.getState().searchQuery.trim();
    const now = Date.now();
    if (
      query.length <= 2 ||
      (lastLogTime && now - lastLogTime < ANALYTICS_LOG_THROTTLE_MS) ||
      useTokenSearchStore.getState().status !== 'success'
    ) {
      return;
    }
    lastLogTime = now;
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
