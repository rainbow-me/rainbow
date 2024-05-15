import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '../resources/assets';

import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { Hex } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';

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
        userAssetsStore.setState({
          userAssetsById: data.map(d => d.uniqueId),
          userAssets: new Map(data.map(d => [d.uniqueId, d as ParsedSearchAsset])),
        });
      },
    }
  );

  return null;
};
