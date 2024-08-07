import { TokenSearchResult, useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { addHexPrefix } from '@/__swaps__/utils/hex';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { useFavorites } from '@/resources/favorites';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { filterList } from '@/utils';
import { isAddress } from '@ethersproject/address';
import { rankings } from 'match-sorter';
import { useCallback, useMemo, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { TokenToBuyListItem } from '../components/TokenList/TokenToBuyList';
import { useSwapContext } from '../providers/swap-provider';
import { RecentSwap } from '@/__swaps__/types/swap';

export type AssetToBuySectionId = 'bridge' | 'recent' | 'favorites' | 'verified' | 'unverified' | 'other_networks';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const MAX_UNVERIFIED_RESULTS = 8;
const MAX_VERIFIED_RESULTS = 48;

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

const filterAssetsFromFavoritesAndBridgeAndRecent = ({
  assets,
  favoritesList,
  filteredBridgeAssetAddress,
  recentSwaps,
}: {
  assets: SearchAsset[] | undefined;
  favoritesList: SearchAsset[] | undefined;
  filteredBridgeAssetAddress: string | undefined;
  recentSwaps: RecentSwap[] | undefined;
}): SearchAsset[] =>
  filterAssetsFromRecentSwaps({
    assets: filterAssetsFromBridge({ assets, filteredBridgeAssetAddress }),
    recentSwaps: recentSwaps,
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

  if (favoritesList?.length) {
    const filteredFavorites = filterAssetsFromBridgeAndRecent({
      assets: favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
    });
    addSection('favorites', filteredFavorites);
  }

  if (combinedData.verifiedAssets?.length) {
    const filteredVerified = filterAssetsFromFavoritesAndBridgeAndRecent({
      assets: combinedData.verifiedAssets,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
    });
    addSection('verified', filteredVerified);
  }

  if (!formattedData.length && combinedData.crosschainExactMatches?.length) {
    const filteredCrosschain = filterAssetsFromFavoritesAndBridgeAndRecent({
      assets: combinedData.crosschainExactMatches,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
    });
    addSection('other_networks', filteredCrosschain);
  }

  if (combinedData.unverifiedAssets?.length) {
    const filteredUnverified = filterAssetsFromFavoritesAndBridgeAndRecent({
      assets: combinedData.unverifiedAssets,
      favoritesList,
      filteredBridgeAssetAddress,
      recentSwaps: combinedData.recentSwaps,
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
  // a moment to update before the heavy re-renders kicked off by these state changes occur.
  const debouncedStateSet = useDebouncedCallback(setState, 20, { leading: false, trailing: true });

  useAnimatedReaction(
    () => ({
      isCrosschainSearch: assetToSell.value ? assetToSell.value.chainId !== selectedOutputChainId.value : false,
      toChainId: selectedOutputChainId.value ?? ChainId.mainnet,
    }),
    (current, previous) => {
      if (previous && (current.isCrosschainSearch !== previous.isCrosschainSearch || current.toChainId !== previous.toChainId)) {
        runOnJS(debouncedStateSet)({
          fromChainId: assetToSell.value ? assetToSell.value.chainId ?? ChainId.mainnet : undefined,
          isCrosschainSearch: current.isCrosschainSearch,
          toChainId: current.toChainId,
        });
      }
    }
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
      chainId: isAddress(query) ? state.toChainId : undefined,
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
        return getExactMatches(data, query).slice(0, MAX_UNVERIFIED_RESULTS);
      },
    }
  );

  return useMemo(() => {
    const toChainId = selectedOutputChainId.value ?? ChainId.mainnet;
    const bridgeResult = memoizedData.filteredBridgeAsset ?? undefined;
    const crosschainMatches = query === '' ? undefined : verifiedAssets?.filter(asset => asset.chainId !== toChainId);
    const verifiedResults = query === '' ? verifiedAssets : verifiedAssets?.filter(asset => asset.chainId === toChainId);
    const unverifiedResults = memoizedData.enableUnverifiedSearch ? unverifiedAssets : undefined;

    return {
      results: buildListSectionsData({
        combinedData: {
          bridgeAsset: bridgeResult,
          crosschainExactMatches: crosschainMatches,
          unverifiedAssets: unverifiedResults,
          verifiedAssets: verifiedResults,
          recentSwaps: recentsForChain,
        },
        favoritesList,
        filteredBridgeAssetAddress: memoizedData.filteredBridgeAsset?.address,
      }),
      isLoading: isLoadingVerifiedAssets || isLoadingUnverifiedAssets,
    };
  }, [
    favoritesList,
    isLoadingUnverifiedAssets,
    isLoadingVerifiedAssets,
    memoizedData.enableUnverifiedSearch,
    memoizedData.filteredBridgeAsset,
    query,
    selectedOutputChainId.value,
    unverifiedAssets,
    verifiedAssets,
    recentsForChain,
  ]);
}
