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
        const searchQuery = userAssetsStore.getState().searchQuery.toLowerCase();

        const filteredUserAssetsById: UniqueId[] = [];
        const userAssets = new Map<UniqueId, ParsedSearchAsset>();
        data.forEach(asset => {
          if (searchQuery) {
            const stringToSearch = `${asset.name} ${asset.symbol} ${asset.address}`.toLowerCase();
            if (stringToSearch.includes(searchQuery)) {
              filteredUserAssetsById.push(asset.uniqueId);
            }
          } else {
            filteredUserAssetsById.push(asset.uniqueId);
          }
          userAssets.set(asset.uniqueId, asset as ParsedSearchAsset);
        });

        userAssetsStore.setState({
          filteredUserAssetsById,
          userAssets,
        });
      },
    }
  );

  return null;
};
