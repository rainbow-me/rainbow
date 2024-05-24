import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '../resources/assets';

import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { Hex } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';

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
        const userAssetsIds: UniqueId[] = [];
        const userAssets = new Map<UniqueId, ParsedSearchAsset>();
        data.forEach(asset => {
          userAssetsIds.push(asset.uniqueId);
          userAssets.set(asset.uniqueId, asset as ParsedSearchAsset);
        });

        userAssetsStore.setState({
          userAssetsIds,
          userAssets,
        });
      },
    }
  );

  return null;
};
