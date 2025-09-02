import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useEffect, useMemo, useRef } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { Address } from 'viem';
import { analytics } from '@/analytics';
import { isNativeAsset } from '@/handlers/assets';
import { addHexPrefix } from '@/handlers/web3';
import { useFavorites } from '@/resources/favorites';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import {
  ADDRESS_SEARCH_KEY,
  NAME_SYMBOL_SEARCH_KEYS,
  useSwapsSearchStore,
  useTokenSearchStore,
  useUnverifiedTokenSearchStore,
} from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { AddressOrEth, AssetType, ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { AssetToBuySectionId, FavoritedAsset, SearchAsset, TokenToBuyListItem } from '@/__swaps__/types/search';
import { RecentSwap } from '@/__swaps__/types/swap';
import { isLowerCaseMatch, filterList, time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { usePopularTokensStore } from '../resources/search/discovery';
import { USDC_ASSET } from '@/__swaps__/screens/Swap/constants';

const ANALYTICS_LOG_THROTTLE_MS = time.seconds(5);
const MAX_POPULAR_RESULTS = 3;

export function useSearchCurrencyLists() {
  const lastTrackedTimeRef = useRef<number | null>(null);
  const verifiedAssets = useTokenSearchStore(state => state.getData());
  const unverifiedAssets = useUnverifiedTokenSearchStore(state => state.getData());
  const popularAssets = usePopularTokensStore(state => state.getData());
  const { favoritesMetadata: favorites } = useFavorites();

  const bridgedInputAsset = useSwapsStore(
    state => getBridgedAsset(state.inputAsset, state.selectedOutputChainId ?? ChainId.mainnet),
    isUniqueIdEqual
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
    const filtered = Object.values(favorites)
      .filter(token => token.networks[toChainId]?.address)
      .map<FavoritedAsset>(favToken => {
        const networks: SearchAsset['networks'] = favToken.networks;
        const network = networks[toChainId];
        const address = (network?.address || favToken.address) as AddressOrEth;
        return {
          ...favToken,
          address,
          chainId: toChainId,
          favorite: true,
          highLiquidity: favToken?.highLiquidity ?? false,
          isNativeAsset: isNativeAsset(address, toChainId),
          isRainbowCurated: favToken.isRainbowCurated ?? false,
          isVerified: favToken.isVerified ?? false,
          mainnetAddress: (networks?.[ChainId.mainnet]?.address || favToken.mainnet_address || '') as AddressOrEth,
          networks,
          type: favToken.type ? (favToken.type as AssetType) : undefined,
          uniqueId: getUniqueId(address, toChainId),
        };
      });
    return filtered.length ? filtered : undefined;
  }, [favorites, toChainId]);

  const filteredBridgeAsset = useMemo(() => {
    if (!bridgedInputAsset) return null;
    return filterBridgeAsset({ asset: bridgedInputAsset, filter: query, isAddress: isContractSearch })
      ? {
          ...bridgedInputAsset,
          favorite: !!unfilteredFavorites?.some(fav => fav.networks?.[toChainId]?.address === bridgedInputAsset.address),
        }
      : null;
  }, [bridgedInputAsset, isContractSearch, query, toChainId, unfilteredFavorites]);

  const favoritesList = useMemo(() => {
    if (query === '') return unfilteredFavorites;
    else {
      const filtered = filterList(unfilteredFavorites || [], isContractSearch ? addHexPrefix(query).toLowerCase() : query, keys, {
        threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      });
      return filtered.length ? filtered : undefined;
    }
  }, [isContractSearch, keys, query, unfilteredFavorites]);

  const recentsForChain = useMemo(() => {
    const filtered = filterList(recentSwaps, query, keys, {
      threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      sorter: matchItems => matchItems.sort((a, b) => b.item.swappedAt - a.item.swappedAt),
    });
    return filtered.length ? filtered : undefined;
  }, [query, isContractSearch, keys, recentSwaps]);

  const popularAssetsForChain = useMemo(() => {
    if (!popularAssets) return undefined;
    if (!query) return popularAssets;
    const filtered = filterList(popularAssets, query, keys, {
      threshold: isContractSearch ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
    });
    return filtered.length ? filtered : undefined;
  }, [isContractSearch, keys, popularAssets, query]);

  // Hardcode USDC for Hyperliquid chain
  const hyperliquidUSDC = useMemo(() => {
    if (toChainId !== 1337) return null;

    // If there's a search query, filter USDC
    if (query && query.length > 0) {
      const symbolMatch = USDC_ASSET.symbol.toLowerCase().includes(query);
      const nameMatch = USDC_ASSET.name.toLowerCase().includes(query);
      const addressMatch = isContractSearch && isLowerCaseMatch(USDC_ASSET.address, query);

      if (symbolMatch || nameMatch || addressMatch) {
        return USDC_ASSET;
      }
      return null;
    }

    return USDC_ASSET;
  }, [toChainId, query, isContractSearch]);

  const data = useDeepCompareMemo(() => {
    // Inject Hyperliquid USDC into the verified assets
    let modifiedVerifiedAssets = verifiedAssets?.results;
    if (hyperliquidUSDC && toChainId === 1337) {
      modifiedVerifiedAssets = [hyperliquidUSDC, ...(verifiedAssets?.results || [])];
    }

    return {
      isLoading: false,
      results: buildListSectionsData({
        combinedData: {
          bridgeAsset: filteredBridgeAsset,
          crosschainExactMatches: verifiedAssets?.crosschainResults,
          popularAssets: popularAssetsForChain,
          recentSwaps: recentsForChain,
          unverifiedAssets: unverifiedAssets,
          verifiedAssets: modifiedVerifiedAssets,
        },
        favoritesList,
        filteredBridgeAssetAddress: filteredBridgeAsset?.address,
      }),
    };
  }, [
    favoritesList,
    filteredBridgeAsset,
    hyperliquidUSDC,
    popularAssetsForChain,
    recentsForChain,
    toChainId,
    unverifiedAssets,
    verifiedAssets?.crosschainResults,
    verifiedAssets?.results,
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
    analytics.track(analytics.event.tokenList, params);
  }, [data.results]);

  return data;
}

function getBridgedAsset(inputAsset: ExtendedAnimatedAssetWithColors | ParsedSearchAsset | null, toChainId: ChainId): SearchAsset | null {
  const isCrosschainSearch = inputAsset ? inputAsset.chainId !== toChainId : false;
  if (!inputAsset || !isCrosschainSearch || !inputAsset.bridging?.networks?.[toChainId]?.bridgeable) return null;

  const network = inputAsset?.networks?.[toChainId];
  if (!network?.address) return null;

  return {
    ...inputAsset,
    address: network.address,
    chainId: toChainId,
    decimals: network.decimals,
    isNativeAsset: isNativeAsset(network.address, toChainId),
    isVerified: !!inputAsset.bridging?.isBridgeable, // isVerified is always undefined for user assets, so we use isBridgeable as a proxy
    mainnetAddress: inputAsset.networks[ChainId.mainnet]?.address ?? (toChainId === ChainId.mainnet ? network.address : ('' as Address)),
    uniqueId: getUniqueId(network.address, toChainId),
  };
}

const mergeAssetsFavoriteStatus = ({
  assets,
  favoritesList,
}: {
  assets: SearchAsset[] | undefined;
  favoritesList: FavoritedAsset[] | undefined;
}): FavoritedAsset[] =>
  assets?.map(asset => ({ ...asset, favorite: favoritesList?.some(fav => fav.address === asset.address) ?? false })) || [];

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

const filterBridgeAsset = ({
  asset,
  filter = '',
  isAddress,
}: {
  asset: SearchAsset | null | undefined;
  filter: string;
  isAddress: boolean;
}) => {
  const normalizedFilter = filter.toLowerCase();
  return (
    filter.length === 0 ||
    asset?.symbol?.toLowerCase().startsWith(normalizedFilter) ||
    asset?.name?.toLowerCase().startsWith(normalizedFilter) ||
    (isAddress && normalizedFilter === asset?.address?.toLowerCase())
  );
};

const buildListSectionsData = ({
  combinedData,
  favoritesList,
  filteredBridgeAssetAddress,
}: {
  combinedData: {
    bridgeAsset: SearchAsset | null;
    verifiedAssets: SearchAsset[] | undefined;
    unverifiedAssets: SearchAsset[] | null;
    crosschainExactMatches: SearchAsset[] | undefined;
    recentSwaps: RecentSwap[] | undefined;
    popularAssets: SearchAsset[] | undefined;
  };
  favoritesList: FavoritedAsset[] | undefined;
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

function isUniqueIdEqual(asset: SearchAsset | null, prevAsset: SearchAsset | null) {
  return asset?.uniqueId === prevAsset?.uniqueId;
}
