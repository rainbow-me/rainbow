import { rankings } from 'match-sorter';
import { useCallback, useMemo, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { addHexPrefix } from '@/__swaps__/utils/hex';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { filterList } from '@/utils';

import { useFavorites } from '@/resources/favorites';
import { isAddress } from '@ethersproject/address';
import { useSwapContext } from '../providers/swap-provider';
import { userAssetsStore } from '@/state/assets/userAssets';
import { filterNonTokenIconAssets } from '../resources/_selectors/search';

export type AssetToBuySectionId = 'bridge' | 'favorites' | 'verified' | 'unverified' | 'other_networks';

export interface AssetToBuySection {
  data: SearchAsset[];
  id: AssetToBuySectionId;
}

const filterBridgeAsset = ({ asset, filter = '' }: { asset?: SearchAsset; filter?: string }) =>
  asset?.address?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.name?.toLowerCase()?.startsWith(filter?.toLowerCase()) ||
  asset?.symbol?.toLowerCase()?.startsWith(filter?.toLowerCase());

export function useSearchCurrencyLists() {
  const { internalSelectedInputAsset: assetToSell, selectedOutputChainId } = useSwapContext();

  const searchQuery = userAssetsStore(state => state.searchQuery);

  const [inputChainId, setInputChainId] = useState(assetToSell.value?.chainId ?? ChainId.mainnet);
  const [toChainId, setToChainId] = useState(selectedOutputChainId.value);
  const [assetToSellAddress, setAssetToSellAddress] = useState(
    assetToSell.value?.[assetToSell.value?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress']
  );

  const query = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  const enableUnverifiedSearch = useMemo(() => searchQuery.length > 2, [searchQuery]);

  useAnimatedReaction(
    () => assetToSell.value,
    (current, previous) => {
      if (previous !== current) {
        runOnJS(setInputChainId)(current?.chainId ?? ChainId.mainnet);
        runOnJS(setAssetToSellAddress)(current?.[current?.chainId === ChainId.mainnet ? 'address' : 'mainnetAddress']);
      }
    }
  );

  useAnimatedReaction(
    () => selectedOutputChainId.value,
    (current, previous) => {
      if (previous !== current) {
        runOnJS(setToChainId)(current);
      }
    }
  );
  const isCrosschainSearch = useMemo(() => {
    return inputChainId && inputChainId !== toChainId;
  }, [inputChainId, toChainId]);

  // provided during swap to filter token search by available routes
  const fromChainId = useMemo(() => {
    return isCrosschainSearch ? inputChainId : undefined;
  }, [inputChainId, isCrosschainSearch]);

  const queryIsAddress = useMemo(() => isAddress(query), [query]);
  const keys: TokenSearchAssetKey[] = useMemo(() => (queryIsAddress ? ['address'] : ['name', 'symbol']), [queryIsAddress]);
  const threshold: TokenSearchThreshold = useMemo(() => (queryIsAddress ? 'CASE_SENSITIVE_EQUAL' : 'CONTAINS'), [queryIsAddress]);

  // static search data
  const { data: verifiedAssets, isLoading: verifiedAssetsLoading } = useTokenSearch(
    { list: 'verifiedAssets' },
    { select: filterNonTokenIconAssets, staleTime: 60 * 60 * 1000, cacheTime: 24 * 60 * 60 * 1000 }
  );

  // current search
  const { data: targetVerifiedAssets, isLoading: targetVerifiedAssetsLoading } = useTokenSearch({
    chainId: toChainId,
    keys,
    list: 'verifiedAssets',
    threshold,
    query,
    fromChainId,
  });
  const { data: targetUnverifiedAssets, isLoading: targetUnverifiedAssetsLoading } = useTokenSearch(
    {
      chainId: toChainId,
      keys,
      list: 'highLiquidityAssets',
      threshold,
      query,
      fromChainId,
    },
    {
      enabled: enableUnverifiedSearch,
    }
  );

  const { favoritesMetadata: favorites } = useFavorites();

  const favoritesList = useMemo(() => {
    const unfilteredFavorites = Object.values(favorites)
      .filter(token => token.networks[toChainId])
      .map(favToken => {
        return {
          ...favToken,
          chainId: toChainId,
          address: favToken.address,
          mainnetAddress: favToken.mainnet_address,
        };
      }) as SearchAsset[];

    if (query === '') {
      return unfilteredFavorites;
    } else {
      const formattedQuery = queryIsAddress ? addHexPrefix(query).toLowerCase() : query;
      return filterList(unfilteredFavorites || [], formattedQuery, keys, {
        threshold: queryIsAddress ? rankings.CASE_SENSITIVE_EQUAL : rankings.CONTAINS,
      });
    }
  }, [favorites, keys, toChainId, query, queryIsAddress]);

  const verifiedAssetsForChain = useMemo(
    () =>
      verifiedAssets
        ?.filter(asset => asset.chainId === toChainId)
        // temporarily limiting the number of assets to display
        // for performance after deprecating `isRainbowCurated`
        .slice(0, 50),
    [verifiedAssets, toChainId]
  );

  const bridgeAsset = useMemo(() => {
    const bridgeAsset = verifiedAssetsForChain?.find(asset => isLowerCaseMatch(asset.mainnetAddress, assetToSellAddress));
    const filteredBridgeAsset = filterBridgeAsset({
      asset: bridgeAsset,
      filter: query,
    })
      ? bridgeAsset
      : null;
    return toChainId === inputChainId ? null : filteredBridgeAsset;
  }, [verifiedAssetsForChain, toChainId, query, inputChainId, assetToSellAddress]);

  const loading = useMemo(() => {
    return query === '' ? verifiedAssetsLoading : targetVerifiedAssetsLoading || targetUnverifiedAssetsLoading;
  }, [query, verifiedAssetsLoading, targetVerifiedAssetsLoading, targetUnverifiedAssetsLoading]);

  const crosschainExactMatches = verifiedAssets?.filter(t => {
    const symbolMatch = isLowerCaseMatch(t?.symbol, query);
    const nameMatch = isLowerCaseMatch(t?.name, query);
    return symbolMatch || nameMatch;
  });

  const filterAssetsFromBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      assets?.filter(
        curatedAsset =>
          !isLowerCaseMatch(curatedAsset?.address, bridgeAsset?.address) && !isLowerCaseMatch(curatedAsset?.address, assetToSellAddress)
      ) || [],
    [assetToSellAddress, bridgeAsset?.address]
  );

  const filterAssetsFromFavoritesBridgeAndAssetToSell = useCallback(
    (assets?: SearchAsset[]) =>
      filterAssetsFromBridgeAndAssetToSell(assets)?.filter(
        curatedAsset =>
          !favoritesList?.map(fav => fav.address).includes(curatedAsset.address) &&
          !favoritesList?.map(fav => fav.address).includes(curatedAsset.mainnetAddress)
      ) || [],
    [favoritesList, filterAssetsFromBridgeAndAssetToSell]
  );

  // the lists below should be filtered by favorite/bridge asset match
  const results = useMemo(() => {
    const sections: AssetToBuySection[] = [];
    if (bridgeAsset) {
      sections.push({
        data: [bridgeAsset],
        id: 'bridge',
      });
    }
    if (favoritesList?.length) {
      sections.push({
        data: filterAssetsFromBridgeAndAssetToSell(favoritesList),
        id: 'favorites',
      });
    }

    if (query === '') {
      sections.push({
        data: filterAssetsFromFavoritesBridgeAndAssetToSell(verifiedAssetsForChain),
        id: 'verified',
      });
    } else {
      if (targetVerifiedAssets?.length) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(targetVerifiedAssets),
          id: 'verified',
        });
      }

      if (targetUnverifiedAssets?.length && enableUnverifiedSearch) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(targetUnverifiedAssets),
          id: 'unverified',
        });
      }

      if (!sections.length && crosschainExactMatches?.length) {
        sections.push({
          data: filterAssetsFromFavoritesBridgeAndAssetToSell(crosschainExactMatches),
          id: 'other_networks',
        });
      }
    }

    return sections;
  }, [
    bridgeAsset,
    crosschainExactMatches,
    enableUnverifiedSearch,
    favoritesList,
    filterAssetsFromBridgeAndAssetToSell,
    filterAssetsFromFavoritesBridgeAndAssetToSell,
    query,
    targetUnverifiedAssets,
    targetVerifiedAssets,
    verifiedAssetsForChain,
  ]);

  return {
    loading,
    results,
  };
}
