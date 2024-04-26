import { useCallback, useRef, useState } from 'react';
import { Hex } from 'viem';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset, ParsedUserAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings } from '@/hooks';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

const sortBy = (userAssetFilter: UserAssetFilter, assets: ParsedAssetsDictByChain) => {
  if (userAssetFilter === 'all') {
    return () => selectUserAssetsList(assets);
  }

  return () => selectUserAssetsListByChainId(userAssetFilter, assets);
};

export const useAssetsToSellSV = () => {
  const { SwapInputController, userAssetFilter } = useSwapContext();
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const currentAssets = useSharedValue<ParsedSearchAsset[]>([]);
  const sortMethod = useRef(userAssetFilter.value);

  const { data: userAssets = [] } = useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
      testnetMode: false,
    },
    {
      select: data => {
        const filteredAssetsDictByChain = Object.keys(data).reduce((acc, key) => {
          const chainKey = Number(key);
          acc[chainKey] = data[chainKey];
          return acc;
        }, {} as ParsedAssetsDictByChain);
        return sortBy(sortMethod.current, filteredAssetsDictByChain)();
      },
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );

  const updateSortMethodAndCurrentAssets = useCallback(
    ({ filter, assets }: { filter: UserAssetFilter; assets: ParsedUserAsset[] }) => {
      sortMethod.current = filter;

      if (filter === 'all') {
        currentAssets.value = assets as ParsedSearchAsset[];
      } else {
        const assetsByChainId = assets.filter(asset => asset.chainId === Number(filter));
        currentAssets.value = assetsByChainId as ParsedSearchAsset[];
      }
    },
    [currentAssets]
  );

  useAnimatedReaction(
    () => ({
      filter: userAssetFilter.value,
      assets: userAssets,
    }),
    (current, previous) => {
      if (previous?.filter !== current.filter || previous?.assets !== current.assets) {
        runOnJS(updateSortMethodAndCurrentAssets)({
          filter: current.filter,
          assets: current.assets,
        });
      }
    }
  );

  const filteredAssetsToSell = useDebouncedCallback((query: string) => {
    return query
      ? (currentAssets.value = userAssets.filter(({ name, symbol, address }) =>
          [name, symbol, address].reduce((res, param) => res || param.toLowerCase().startsWith(query.toLowerCase()), false)
        ) as ParsedSearchAsset[])
      : (currentAssets.value = userAssets as ParsedSearchAsset[]);
  }, 50);

  useAnimatedReaction(
    () => SwapInputController.searchQuery.value,
    (current, previous) => {
      if (previous !== current) {
        runOnJS(filteredAssetsToSell)(current);
      }
    }
  );

  return currentAssets;
};
