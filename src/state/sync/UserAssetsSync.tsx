import { memo, useEffect } from 'react';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';

export const UserAssetsSync = memo(function UserAssetsSync() {
  const { accountAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

  const { isLoading } = useUserAssets(
    {
      address: accountAddress,
      currency: currentCurrency,
    },
    {
      enabled: !!accountAddress && !isSwapsOpen,
      staleTime: 1000 * 60,
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        if (!isSwapsOpen) {
          userAssetsStore.getState(accountAddress).setUserAssets(data as ParsedSearchAsset[]);

          const inputAsset = userAssetsStore.getState(accountAddress).getHighestValueEth();
          useSwapsStore.setState({
            inputAsset,
            selectedOutputChainId: inputAsset?.chainId ?? ChainId.mainnet,
          });
        }
      },
    }
  );

  useEffect(() => userAssetsStore.setState(accountAddress, { isLoadingUserAssets: isLoading }), [accountAddress, isLoading]);

  return null;
});
