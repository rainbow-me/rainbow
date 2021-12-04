import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export default function useOpenSavings() {
  const [isSavingsOpen, setIsSavingsOpen] = useMMKVBoolean('savings-open');

  const toggleOpenSavings = useCallback(() => setIsSavingsOpen(prev => !prev), [
    setIsSavingsOpen,
  ]);

  return {
    isSavingsOpen,
    toggleOpenSavings,
  };
}
