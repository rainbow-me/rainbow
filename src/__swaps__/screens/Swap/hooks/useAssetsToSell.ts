import { useMemo } from 'react';
import { Hex } from 'viem';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '../resources/_selectors/assets';

import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAsset, ParsedAssetsDictByChain, ParsedSearchAsset } from '@/__swaps__/screens/Swap/types/assets';
import { isLowerCaseMatch } from '@/__swaps__/screens/Swap/utils/strings';
import type { SortMethod } from '@/__swaps__/screens/Swap/types/swap';
import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { useAccountSettings } from '@/hooks';
import { useSwapAssetStore } from '../state/assets';

const sortBy = (by: SortMethod) => {
  switch (by) {
    case 'token':
      return selectUserAssetsList;
    case 'chain':
      return selectUserAssetsListByChainId;
  }
};

export const isSameAsset = (a1: Pick<ParsedAsset, 'chainId' | 'address'>, a2: Pick<ParsedAsset, 'chainId' | 'address'>) =>
  +a1.chainId === +a2.chainId && isLowerCaseMatch(a1.address, a2.address);

export const useAssetsToSell = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const { searchFilter, sortMethod } = useSwapAssetStore();

  const debouncedSearchFilter = useDebounce(searchFilter, 200);

  const { data: userAssets = [] } = useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
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
    }
  );

  const filteredAssetsToSell = useMemo(() => {
    return debouncedSearchFilter
      ? userAssets.filter(({ name, symbol, address }) =>
          [name, symbol, address].reduce((res, param) => res || param.toLowerCase().startsWith(debouncedSearchFilter.toLowerCase()), false)
        )
      : userAssets;
  }, [debouncedSearchFilter, userAssets]) as ParsedSearchAsset[];

  return filteredAssetsToSell;
};
