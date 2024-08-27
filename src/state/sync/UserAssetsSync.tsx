import { useEffect } from 'react';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { getIsHardhatConnected } from '@/handlers/web3';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';

export const UserAssetsSync = function UserAssetsSync() {
  const { accountAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

  const { isLoading } = useUserAssets(
    {
      address: accountAddress,
      currency: currentCurrency,
      testnetMode: getIsHardhatConnected(),
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

  useEffect(() => userAssetsStore.setState({ isLoadingUserAssets: isLoading }), [isLoading]);

  return null;
};
