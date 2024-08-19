import { ChainId } from '@/networks/types';
import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { networkObjects } from '@/networks';

export function useUserAsset(uniqueId: string) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { connectedToHardhat } = useConnectedToHardhatStore();

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
  const { nativeCurrency } = networkObjects[chainId];
  const { address } = nativeCurrency;
  const uniqueId = getUniqueId(address, chainId);
  return useUserAsset(uniqueId);
}
