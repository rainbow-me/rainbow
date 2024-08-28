import { Address } from 'viem';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ChainId } from '@/networks/types';
import { useConnectedToHardhatStore } from '../connectedToHardhat';

export const UserAssetsSync = function UserAssetsSync() {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const userAssetsWalletAddress = userAssetsStore(state => state.associatedWalletAddress);
  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);
  const { connectedToHardhat } = useConnectedToHardhatStore();

  useUserAssets(
    {
      address: currentAddress as Address,
      currency: currentCurrency,
      testnetMode: connectedToHardhat,
    },
    {
      enabled: !isSwapsOpen || userAssetsWalletAddress !== currentAddress,
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

  return null;
};
