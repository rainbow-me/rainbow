import { useAccountSettings } from '@/hooks';
import { selectSortedUserAssets } from '@/resources/assets/assetSelectors';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { useCallback } from 'react';

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
      select: useCallback(selectSortedUserAssets(nativeCurrency), [nativeCurrency]),
    }
  );
}
