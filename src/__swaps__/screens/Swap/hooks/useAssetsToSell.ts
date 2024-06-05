import { useMemo } from 'react';
import { Address } from 'viem';

import {
  selectUserAssetsList,
  selectUserAssetsListByChainId,
  selectorFilterByUserChains,
} from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAssetsDictByChain, ParsedSearchAsset, UserAssetFilter } from '@/__swaps__/types/assets';
import { useAccountSettings, useDebounce } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';

const sortBy = (by: UserAssetFilter) => {
  switch (by) {
    case 'all':
      return selectUserAssetsList;
    default:
      return (data: ParsedAssetsDictByChain) => selectUserAssetsListByChainId(data, by);
  }
};

export const useAssetsToSell = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency, network: currentNetwork } = useAccountSettings();

  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);

  const filter = userAssetsStore(state => state.filter);
  const searchQuery = userAssetsStore(state => state.inputSearchQuery);

  const debouncedAssetToSellFilter = useDebounce(searchQuery, 200);

  const { data: userAssets = [] } = useUserAssets(
    {
      address: currentAddress as Address,
      currency: currentCurrency,
      testnetMode: connectedToHardhat,
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
