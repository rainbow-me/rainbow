import { useRef, useState } from 'react';
import { Hex } from 'viem';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '../resources/_selectors/assets';

import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedUserAsset } from '@/__swaps__/screens/Swap/types/assets';
import type { SortMethod } from '@/__swaps__/screens/Swap/types/swap';
import { useAccountSettings } from '@/hooks';
import { useSwapAssetStore } from '../state/assets';
import { useSwapContext } from '../providers/swap-provider';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

const sortBy = (by: SortMethod) => {
  switch (by) {
    case 'token':
      return selectUserAssetsList;
    case 'chain':
      return selectUserAssetsListByChainId;
  }
};

export const useAssetsToSell = () => {
  const { SwapInputController } = useSwapContext();
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();
  const { sortMethod } = useSwapAssetStore();

  const [currentAssets, setCurrentAssets] = useState<ParsedUserAsset[]>([]);

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
        return sortBy(sortMethod)(filteredAssetsDictByChain);
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
          )
        )
      : setCurrentAssets(userAssets);
  }, 200);

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
