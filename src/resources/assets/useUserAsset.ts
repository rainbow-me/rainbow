import { ChainId } from '@/state/backendNetworks/types';
import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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
  const nativeCurrency = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
  const { address } = nativeCurrency;
  const uniqueId = getUniqueId(address, chainId);
  return useUserAsset(uniqueId);
}
