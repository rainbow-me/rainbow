import { useCallback, useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useOpenFamilies() {
  const accountAddress = useAccountAddress();
  const [openFamilies, setOpenFamilies] = useMMKVObject<Record<string, boolean>>('open-families-' + accountAddress);

  const updateOpenFamilies = useCallback(
    (value: Record<string, boolean>) =>
      setOpenFamilies(prevValue => ({
        ...(prevValue as Record<string, boolean>),
        ...value,
      })),
    [setOpenFamilies]
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
