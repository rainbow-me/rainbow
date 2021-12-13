import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

export default function useOpenSavings() {
  const { accountAddress } = useAccountSettings();
  const [isSavingsOpen, setIsSavingsOpen] = useMMKVBoolean(
    'savings-open-' + accountAddress
  );

  const toggleOpenSavings = useCallback(() => setIsSavingsOpen(prev => !prev), [
    setIsSavingsOpen,
  ]);

  return {
    isSavingsOpen,
    toggleOpenSavings,
  };
}
