import { useMemo } from 'react';
import { Hex } from 'viem';

import {
  selectUserAssetsList,
  selectUserAssetsListByChainId,
  selectorFilterByUserChains,
} from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings } from '@/hooks';
import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { swapsStore } from '@/state/swaps/swapsStore';

const sortBy = (by: UserAssetFilter) => {
  switch (by) {
    case 'all':
      return selectUserAssetsList;
    default:
      return (data: ParsedAssetsDictByChain) => selectUserAssetsListByChainId(data, by);
  }
};

export const useAssetsToSell = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const { filter, searchQuery } = swapsStore(state => ({ filter: state.filter, searchQuery: state.inputSearchQuery }));

  const debouncedAssetToSellFilter = useDebounce(searchQuery, 200);

  const { data: userAssets = [] } = useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
    },
    {
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: sortBy(filter),
        }),
    }
  );

  const filteredAssetsToSell = useMemo(() => {
    return debouncedAssetToSellFilter
      ? userAssets.filter(({ name, symbol, address }) =>
          [name, symbol, address].reduce(
            (res, param) => res || param.toLowerCase().startsWith(debouncedAssetToSellFilter.toLowerCase()),
            false
          )
        )
      : userAssets;
  }, [debouncedAssetToSellFilter, userAssets]) as ParsedSearchAsset[];

  return filteredAssetsToSell;
};
