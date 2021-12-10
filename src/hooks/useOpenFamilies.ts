import { useCallback, useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useAccountSettings } from '@rainbow-me/hooks';

export default function useOpenFamilies() {
  const { accountAddress: address } = useAccountSettings();
  const [openFamilies, setOpenFamilies] = useMMKVObject('open-families-' + address);

  const updateOpenFamilies = useCallback(
    (value: Record<string, boolean>) =>
      setOpenFamilies({
        ...(openFamilies as Record<string, boolean>),
        ...value,
      }),
    [openFamilies, setOpenFamilies]
  );

  const openFamiliesWithDefault = useMemo(
    () => ({
      'Showcase-showcase': true,
      ...(openFamilies as Record<string, boolean>),
    }),
    [openFamilies]
  ) as Record<string, boolean>;

  return {
    openFamilies: openFamiliesWithDefault,
    updateOpenFamilies,
  };
}
