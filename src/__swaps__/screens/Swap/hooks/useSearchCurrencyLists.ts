import { rankings } from 'match-sorter';
import { useCallback, useMemo, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { TokenSearchResult, useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { addHexPrefix } from '@/__swaps__/utils/hex';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { filterList } from '@/utils';
import { useFavorites } from '@/resources/favorites';
import { isAddress } from '@ethersproject/address';
import { useSwapContext } from '../providers/swap-provider';
import { filterNonTokenIconAssets } from '../resources/_selectors/search';
import { useDebouncedCallback } from 'use-debounce';
import { useSwapsStore } from '@/state/swaps/swapsStore';

export type AssetToBuySectionId = 'bridge' | 'favorites' | 'verified' | 'unverified' | 'other_networks';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const filterBridgeAsset = ({ asset, filter = '' }: { asset: SearchAsset | null | undefined; filter: string }) =>
  asset?.address?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.name?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.symbol?.toLowerCase()?.startsWith(filter?.toLowerCase());

export function useSearchCurrencyLists() {
  const { internalSelectedInputAsset: assetToSell, selectedOutputChainId } = useSwapContext();

  const query = useSwapsStore(state => state.outputSearchQuery.trim().toLowerCase());

  const [state, setState] = useState({
    assetToSellAddress: assetToSell.value?.[assetToSell.value?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress'],
    fromChainId: assetToSell.value?.chainId ?? undefined,
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
          assetToSellAddress: assetToSell.value?.[assetToSell.value?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress'],
          fromChainId: assetToSell.value?.chainId ?? undefined,
          isCrosschainSearch: current.isCrosschainSearch,
          toChainId: current.toChainId,
        });
      }
    }
  );

  const sliceTopResultsByNetworkWithCoinIconUrls = useCallback(
    (data: TokenSearchResult) => {
      const matchingNetwork = data.filter(asset => asset.chainId === state.toChainId);
      return matchingNetwork.slice(0, 20).filter(asset => asset.icon_url);
    },
    [state.toChainId]
  );

  const { data: verifiedAssets, isLoading: verifiedAssetsLoading } = useTokenSearch(
    { list: 'verifiedAssets' },
    {
      select: query.length > 0 ? filterNonTokenIconAssets : sliceTopResultsByNetworkWithCoinIconUrls,
      staleTime: 60 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 10000,
    }
  );

  const memoizedData = useMemo(() => {
    const fromChainId = state.isCrosschainSearch ? state.fromChainId : undefined;
    const queryIsAddress = isAddress(query);
    const keys: TokenSearchAssetKey[] = queryIsAddress ? ['address'] : ['name', 'symbol'];
    const threshold: TokenSearchThreshold = queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS';
    const enableUnverifiedSearch = query.length > 2;

    const bridgeAsset = state.isCrosschainSearch
      ? verifiedAssets?.find(asset => isLowerCaseMatch(asset.mainnetAddress, state.assetToSellAddress))
      : null;
    const filteredBridgeAsset = bridgeAsset && filterBridgeAsset({ asset: bridgeAsset, filter: query }) ? bridgeAsset : null;

    return {
      isCrosschainSearch: state.isCrosschainSearch,
      fromChainId,
      queryIsAddress,
      keys,
      threshold,
      enableUnverifiedSearch,
      verifiedAssetsForChain: verifiedAssets,
      filteredBridgeAsset,
    };
  }, [state.assetToSellAddress, state.fromChainId, state.isCrosschainSearch, query, verifiedAssets]);

  const { favoritesMetadata: rawFavorites } = useFavorites();
  const favorites = useMemo(() => Object.values(rawFavorites), [rawFavorites]);

  const unfilteredFavorites = useMemo(() => {
    return Object.values(favorites)
      .filter(token => token.networks[state.toChainId])
      .map(favToken => ({
        ...favToken,
        chainId: state.toChainId,
        mainnetAddress: favToken.mainnet_address,
      })) as SearchAsset[];
  }, [favorites, state.toChainId]);

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

  const { data: targetVerifiedAssets, isLoading: targetVerifiedAssetsLoading } = useTokenSearch({
    chainId: state.toChainId,
    keys: memoizedData.keys,
    list: 'verifiedAssets',
    threshold: memoizedData.threshold,
    query,
    fromChainId: memoizedData.fromChainId,
  });

  const { data: targetUnverifiedAssets, isLoading: targetUnverifiedAssetsLoading } = useTokenSearch(
    {
      chainId: state.toChainId,
      keys: memoizedData.keys,
      list: 'highLiquidityAssets',
      threshold: memoizedData.threshold,
      query,
      fromChainId: memoizedData.fromChainId,
    },
    {
      enabled: query.length > 0 && memoizedData.enableUnverifiedSearch,
    }
  );

  const crosschainExactMatches = useMemo(
    () =>
      verifiedAssets?.filter(t => {
        const symbolMatch = isLowerCaseMatch(t?.symbol, query);
        const nameMatch = isLowerCaseMatch(t?.name, query);
        return symbolMatch || nameMatch;
      }),
    [query, verifiedAssets]
  );

  const filterAssetsFromBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      assets?.filter(
        curatedAsset =>
          !isLowerCaseMatch(curatedAsset?.address, memoizedData.filteredBridgeAsset?.address) &&
          !isLowerCaseMatch(curatedAsset?.address, state.assetToSellAddress)
      ) || [],
    [memoizedData.filteredBridgeAsset?.address, state.assetToSellAddress]
  );

  const filterAssetsFromFavoritesBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      filterAssetsFromBridgeAndAssetToSell(assets)?.filter(
        curatedAsset => !favoritesList?.some(({ address }) => curatedAsset.address === address || curatedAsset.mainnetAddress === address)
      ) || [],
    [favoritesList, filterAssetsFromBridgeAndAssetToSell]
  );

  const combinedData = useMemo(
    () => ({
      bridgeAsset: memoizedData.filteredBridgeAsset,
      verifiedAssets: query === '' ? memoizedData.verifiedAssetsForChain : targetVerifiedAssets,
      unverifiedAssets: memoizedData.enableUnverifiedSearch ? targetUnverifiedAssets : undefined,
      crosschainExactMatches: query !== '' && !targetVerifiedAssets?.length ? crosschainExactMatches : undefined,
    }),
    [
      crosschainExactMatches,
      memoizedData.enableUnverifiedSearch,
      memoizedData.filteredBridgeAsset,
      memoizedData.verifiedAssetsForChain,
      query,
      targetUnverifiedAssets,
      targetVerifiedAssets,
    ]
  );

  const results = useMemo(() => {
    const sections: AssetToBuySection[] = [];

    if (combinedData.bridgeAsset) {
      sections.push({
        data: [combinedData.bridgeAsset],
        id: 'bridge',
      });
    }

    if (favoritesList?.length) {
      sections.push({
        data: filterAssetsFromBridgeAndAssetToSell(favoritesList),
        id: 'favorites',
      });
    }

    if (combinedData.verifiedAssets?.length) {
      sections.push({
        data: filterAssetsFromFavoritesBridgeAndAssetToSell(combinedData.verifiedAssets),
        id: 'verified',
      });
    }

    if (combinedData.unverifiedAssets?.length) {
      sections.push({
        data: filterAssetsFromFavoritesBridgeAndAssetToSell(combinedData.unverifiedAssets),
        id: 'unverified',
      });
    }

    if (!sections.length && combinedData.crosschainExactMatches?.length) {
      sections.push({
        data: filterAssetsFromFavoritesBridgeAndAssetToSell(combinedData.crosschainExactMatches),
        id: 'other_networks',
      });
    }

    return sections;
  }, [
    combinedData.bridgeAsset,
    combinedData.crosschainExactMatches,
    combinedData.unverifiedAssets,
    combinedData.verifiedAssets,
    favoritesList,
    filterAssetsFromBridgeAndAssetToSell,
    filterAssetsFromFavoritesBridgeAndAssetToSell,
  ]);

  return useMemo(() => {
    const isLoading =
      verifiedAssetsLoading || targetVerifiedAssetsLoading || (memoizedData.enableUnverifiedSearch && targetUnverifiedAssetsLoading);

    return {
      loading: isLoading,
      results,
    };
  }, [memoizedData.enableUnverifiedSearch, results, targetUnverifiedAssetsLoading, targetVerifiedAssetsLoading, verifiedAssetsLoading]);
}
