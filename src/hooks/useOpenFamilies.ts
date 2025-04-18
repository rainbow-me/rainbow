import { useCallback, useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import { useExternalNftCollectionsStore, useUserNftCollectionsStore } from '@/state/nfts';
import { useExternalProfileStore } from '@/state/nfts/externalNfts';

export default function useOpenFamilies(external?: boolean) {
  const { accountAddress } = useAccountSettings();
  const externalAddress = useExternalProfileStore(s => s.externalProfile);
  const openFamilies = useUserNftCollectionsStore(s => s.getOpenFamilies(accountAddress));
  const openFamiliesExternal = useExternalNftCollectionsStore(s => s.getOpenFamilies(externalAddress || ''));
  const setOpenFamilies = useUserNftCollectionsStore(s => s.updateOpenFamilies);
  const setOpenFamiliesExternal = useExternalNftCollectionsStore(s => s.updateOpenFamilies);

  const updateOpenFamilies = useCallback(
    (value: Record<string, boolean>) => {
      if (external) {
        setOpenFamiliesExternal(value);
      } else {
        setOpenFamilies(value);
      }
    },
    [setOpenFamilies, setOpenFamiliesExternal, external]
  );

  const openFamiliesWithDefault = useMemo(() => {
    const families = !external ? openFamilies : openFamiliesExternal;
    return {
      Showcase: true,
      ...(families || {}),
    } as Record<string, boolean>;
  }, [external, openFamilies, openFamiliesExternal]);

  return {
    openFamilies: openFamiliesWithDefault,
    updateOpenFamilies,
  };
}
