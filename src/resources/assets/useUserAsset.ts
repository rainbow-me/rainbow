import { ChainId } from '@/networks/types';
import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { getNetworkObject } from '@/networks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { getUniqueId } from '@/utils/ethereumUtils';

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
  const { nativeCurrency } = getNetworkObject({ chainId });
  const { address } = nativeCurrency;
  const uniqueId = getUniqueId(address, chainId);
  return useUserAsset(uniqueId);
}
