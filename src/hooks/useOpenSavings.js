import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenSavings() {
  const { accountAddress: address } = useAccountSettings();
  const [isSavingsOpen, setIsSavingsOpen] = useMMKVBoolean(
    'savings-open-' + address
  );

  const toggleOpenSavings = useCallback(() => setIsSavingsOpen(prev => !prev), [
    setIsSavingsOpen,
  ]);

  return {
    isSavingsOpen,
    toggleOpenSavings,
  };
}
