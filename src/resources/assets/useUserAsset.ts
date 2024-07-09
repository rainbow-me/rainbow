import { ChainId } from '@/__swaps__/types/chains';
import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { getNetworkObj } from '@/networks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
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

export function useUserNativeNetworkAsset(chainId: ChainId) {
  const network = getNetworkFromChainId(chainId);
  const { nativeCurrency } = getNetworkObj(network);
  const { address } = nativeCurrency;
  const uniqueId = `${address}_${network}`;
  return useUserAsset(uniqueId);
}
