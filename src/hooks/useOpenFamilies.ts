import { useAccountSettings } from '@/hooks';
import { useOpenFamiliesStore } from '@/state/nfts';
import { useCallback } from 'react';

export default function useOpenFamilies() {
  const { accountAddress } = useAccountSettings();
  const openFamilies = useOpenFamiliesStore(s => s.getOpenFamilies(accountAddress));
  const updateOpenFamilies = useCallback(
    (updates: Record<string, boolean>) => {
      useOpenFamiliesStore.getState().updateOpenFamilies(accountAddress, updates);
    },
    [accountAddress]
  );
  return {
    openFamilies,
    updateOpenFamilies,
  };
}
