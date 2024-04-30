import { useMemo } from 'react';
import { Hex } from 'viem';

import {
  selectUserAssetsList,
  selectUserAssetsListByChainId,
  selectorFilterByUserChains,
} from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings } from '@/hooks';
import { useSwapSortByStore } from '@/state/swaps/sortBy';
import { useSwapSearchStore } from '@/state/swaps/search';
import { useDebounce } from '@/hooks/useDebounce';
import { ChainId } from '@/__swaps__/types/chains';

const sortBy = (by: UserAssetFilter) => {
  switch (by) {
    case 'all':
      return selectUserAssetsList;
    default:
      return selectUserAssetsListByChainId;
  }
};

export const useAssetsToSell = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const sortMethod = useSwapSortByStore(state => state.sortBy);
  const searchQuery = useSwapSearchStore(state => state.query);

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
          chainId: sortMethod as ChainId,
          selector: sortBy(sortMethod),
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
