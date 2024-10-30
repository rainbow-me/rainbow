import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ChainId } from '@/chains/types';

export const UserAssetsSync = function UserAssetsSync() {
  const { accountAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  useUserAssets(
    {
      address: accountAddress,
      currency: currentCurrency,
    },
    {
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        userAssetsStore.getState().setUserAssets(data as ParsedSearchAsset[]);

        const inputAsset = userAssetsStore.getState().getHighestValueEth();
        useSwapsStore.setState({
          inputAsset,
          selectedOutputChainId: inputAsset?.chainId ?? ChainId.mainnet,
        });
      },
    }
  );

  return null;
};
