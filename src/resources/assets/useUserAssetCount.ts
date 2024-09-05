import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { RainbowAddressAssets } from './types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';

const countSelector = (accountAssets: RainbowAddressAssets) => accountAssets?.length;

export function useUserAssetCount() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { connectedToHardhat } = useConnectedToHardhatStore();

  return useUserAssets(
    {
      address: accountAddress,
      currency: nativeCurrency,
      connectedToHardhat,
    },
    {
      select: countSelector,
    }
  );
}
