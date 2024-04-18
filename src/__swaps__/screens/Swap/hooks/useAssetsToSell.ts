import { useState } from 'react';
import { Hex } from 'viem';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { SortMethod } from '@/__swaps__/types/swap';
import { useAccountSettings } from '@/hooks';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

const sortBy = (by: SortMethod) => {
  switch (by) {
    case SortMethod.token:
      return selectUserAssetsList;
    case SortMethod.chain:
      return selectUserAssetsListByChainId;
  }
};

export const useAssetsToSell = () => {
  const { SwapInputController } = useSwapContext();
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  // TODO: Actually implement sortMethod here
  const sortMethod = useSharedValue(SortMethod.token);

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
        return sortBy(sortMethod.value)(filteredAssetsDictByChain);
      },
      cacheTime: Infinity,
      staleTime: Infinity,
    }
  );

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
