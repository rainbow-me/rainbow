import { useEffect } from 'react';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ChainId } from '@/networks/types';

export const UserAssetsSync = function UserAssetsSync() {
  const { accountAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

  const { isLoading } = useUserAssets(
    {
      address: accountAddress,
      currency: currentCurrency,
    },
    {
      enabled: !!accountAddress && !isSwapsOpen,
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        if (!isSwapsOpen) {
          userAssetsStore.getState().setUserAssets(data as ParsedSearchAsset[]);

          const inputAsset = userAssetsStore.getState().getHighestValueEth();
          useSwapsStore.setState({
            inputAsset,
            selectedOutputChainId: inputAsset?.chainId ?? ChainId.mainnet,
          });
        }
      },
    }
  );

  useEffect(() => {
    userAssetsStore.setState({ isLoadingUserAssets: isLoading });
    return () => userAssetsStore.setState({ isLoadingUserAssets: false });
  }, [isLoading]);

  return null;
};
