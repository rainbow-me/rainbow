import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { RainbowAddressAssets } from './types';

const countSelector = (accountAssets: RainbowAddressAssets) => accountAssets?.length;

export function useUserAssetCount() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const connectedToHardhat = getIsHardhatConnected();

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
