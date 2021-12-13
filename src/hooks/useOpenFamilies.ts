import { useCallback, useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenFamilies() {
  const { accountAddress } = useAccountSettings();
  const [openFamilies, setOpenFamilies] = useMMKVObject(
    'open-families-' + accountAddress
  );

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
      Showcase: true,
      ...(openFamilies as Record<string, boolean>),
    }),
    [openFamilies]
  ) as Record<string, boolean>;

  return {
    openFamilies: openFamiliesWithDefault,
    updateOpenFamilies,
  };
}
