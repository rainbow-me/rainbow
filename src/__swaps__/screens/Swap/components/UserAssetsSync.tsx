import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '../resources/assets';

import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { Hex } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { mergeMaps, mergeSets } from '@/__swaps__/utils/assets';

export const UserAssetsSync = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
    },
    {
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        const { userAssetsById, userAssets } = userAssetsStore.getState();

        userAssetsStore.setState({
          userAssetsById: mergeSets(userAssetsById, new Set(data.map(d => d.uniqueId))),
          userAssets: mergeMaps(userAssets, new Map(data.map(d => [d.uniqueId, d as ParsedSearchAsset]))),
        });
      },
    }
  );

  return null;
};
