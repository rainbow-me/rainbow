import { useRef, useState } from 'react';
import { Hex } from 'viem';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings } from '@/hooks';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

const sortBy = (by: UserAssetFilter, assets: ParsedAssetsDictByChain) => {
  if (by === 'all') {
    return () => selectUserAssetsList(assets);
  }

  return () => selectUserAssetsListByChainId(by, assets);
};

export const useAssetsToSell = () => {
  const { SwapInputController, userAssetFilter } = useSwapContext();
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const [currentAssets, setCurrentAssets] = useState<ParsedSearchAsset[]>([]);
  const sortMethod = useRef(userAssetFilter.value);

  useAnimatedReaction(
    () => userAssetFilter.value,
    (current, previous) => {
      if (previous !== current) {
        sortMethod.current = current;
      }
    }
  );

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
