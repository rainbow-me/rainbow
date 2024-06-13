import { ChainId } from '@/__swaps__/types/chains';
import { Network } from '@/helpers';
import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { getNetworkObj } from '@/networks';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';

export function useUserAsset(uniqueId: string) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const connectedToHardhat = getIsHardhatConnected();

  return useUserAssets(
    {
      address: accountAddress,
      currency: nativeCurrency,
      connectedToHardhat,
    },
    {
      select: selectUserAssetWithUniqueId(uniqueId),
    }
  );
}

export const getNetworkNativeAssetUniqueId = (chainId: ChainId) => {
  const network = getNetworkFromChainId(chainId);
  const { nativeCurrency } = getNetworkObj(network);
  const { mainnetAddress, address } = nativeCurrency;
  const uniqueId = mainnetAddress ? `${mainnetAddress}_${Network.mainnet}` : `${address}_${network}`;
  return uniqueId;
};

export function useUserNativeNetworkAsset(chainId: ChainId) {
  const uniqueId = getNetworkNativeAssetUniqueId(chainId);
  return useUserAsset(uniqueId);
}
