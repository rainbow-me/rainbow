import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';

export function useUserAsset(uniqueId: string) {
  const { accountAddress, nativeCurrency, network: currentNetwork } = useAccountSettings();
  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);

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
