import { Address } from 'viem';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { useUserAssets } from '../resources/assets';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';

export const UserAssetsSync = function UserAssetsSync() {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency, network: currentNetwork } = useAccountSettings();
  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);

  const userAssetsWalletAddress = userAssetsStore(state => state.associatedWalletAddress);
  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

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

          const inputAsset = userAssetsStore.getState().getHighestValueAsset();
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
