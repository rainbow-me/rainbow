import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export function usePerpsFeatureCard() {
  const [isDismissed, setIsDismissed] = useMMKVBoolean('dismissed-perps-feature-card');

  const dismiss = useCallback(() => setIsDismissed(true), [setIsDismissed]);

  return {
    isDismissed,
    dismiss,
  };
}
