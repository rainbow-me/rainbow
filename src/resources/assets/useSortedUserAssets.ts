import { useAccountSettings } from '@/hooks';
import { selectSortedUserAssets } from '@/resources/assets/assetSelectors';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';

export function useSortedUserAssets() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { connectedToHardhat } = useConnectedToHardhatStore();

  return useUserAssets(
    {
      address: accountAddress,
      currency: nativeCurrency,
      connectedToHardhat,
    },
    {
      select: selectSortedUserAssets(nativeCurrency),
    }
  );
}
