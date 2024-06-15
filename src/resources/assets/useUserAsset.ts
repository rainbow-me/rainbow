import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { selectUserAssetWithUniqueId } from '@/resources/assets/assetSelectors';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';

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
