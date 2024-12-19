import { memo } from 'react';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { IS_TEST } from '@/env';

function UserAssetsSyncComponent() {
  const { accountAddress, nativeCurrency: currentCurrency } = useAccountSettings();
  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);
  const isUserAssetsStoreMissingData = userAssetsStore.getState().getUserAssets()?.length === 0;
  const enabled = (!isSwapsOpen || isUserAssetsStoreMissingData) && !!accountAddress && !!currentCurrency;

  useUserAssets(
    {
      address: accountAddress,
      currency: currentCurrency,
    },
    {
      enabled,
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        if (!isSwapsOpen || isUserAssetsStoreMissingData) {
          userAssetsStore.getState().setUserAssets(data as ParsedSearchAsset[]);

          const inputAsset = userAssetsStore.getState().getHighestValueNativeAsset();
          useSwapsStore.setState({
            inputAsset,
            selectedOutputChainId: inputAsset?.chainId ?? ChainId.mainnet,
          });
        }
      },
    }
  );

  return null;
}

export const UserAssetsSync = IS_TEST ? UserAssetsSyncComponent : memo(UserAssetsSyncComponent);
