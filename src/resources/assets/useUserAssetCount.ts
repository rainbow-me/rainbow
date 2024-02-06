import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { RainbowAddressAssets } from './types';

const countSelector = (accountAssets: RainbowAddressAssets) => accountAssets?.length;

export function useUserAssetCount() {
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
      select: countSelector,
    }
  );
}
