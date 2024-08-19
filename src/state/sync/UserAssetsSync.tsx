import { memo, useEffect } from 'react';
import { Address } from 'viem';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';

export const UserAssetsSync = memo(function UserAssetsSync() {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const userAssetsWalletAddress = userAssetsStore(state => state.associatedWalletAddress);
  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

  const { isLoading } = useUserAssets(
    {
      address: currentAddress as Address,
      currency: currentCurrency,
    },
    {
      enabled: !!currentAddress && (!isSwapsOpen || userAssetsWalletAddress !== currentAddress),
      staleTime: 1000 * 60,
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        if (!isSwapsOpen || userAssetsWalletAddress !== currentAddress) {
          userAssetsStore.getState().setUserAssets(currentAddress as Address, data as ParsedSearchAsset[]);

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
});
