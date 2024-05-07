import { useState } from 'react';
import { Hex } from 'viem';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings } from '@/hooks';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { swapsStore } from '@/state/swaps/swapsStore';

const sortBy = (userAssetFilter: UserAssetFilter, assets: ParsedAssetsDictByChain) => {
  if (userAssetFilter === 'all') {
    return () => selectUserAssetsList(assets);
  }

  return () => selectUserAssetsListByChainId(userAssetFilter, assets);
};

export const useAssetsToSell = () => {
  const { SwapInputController } = useSwapContext();

  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const [currentAssets, setCurrentAssets] = useState<ParsedSearchAsset[]>([]);

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

        const filter = swapsStore.getState().filter;

        return sortBy(filter, filteredAssetsDictByChain)();
      },
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );

  swapsStore.subscribe(({ filter }) => {
    if (filter === 'all') {
      setCurrentAssets(userAssets as ParsedSearchAsset[]);
    } else {
      const assetsByChainId = userAssets.filter(asset => asset.chainId === Number(filter));
      setCurrentAssets(assetsByChainId as ParsedSearchAsset[]);
    }
  });

  const filteredAssetsToSell = useDebouncedCallback((query: string) => {
    return query
      ? setCurrentAssets(
          userAssets.filter(({ name, symbol, address }) =>
            [name, symbol, address].reduce((res, param) => res || param.toLowerCase().startsWith(query.toLowerCase()), false)
          ) as ParsedSearchAsset[]
        )
      : setCurrentAssets(userAssets as ParsedSearchAsset[]);
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
