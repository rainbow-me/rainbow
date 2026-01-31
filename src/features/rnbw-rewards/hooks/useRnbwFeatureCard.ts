import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export function useRnbwFeatureCard() {
  const [isDismissed, setIsDismissed] = useMMKVBoolean('dismissed-rnbw-feature-card');

  const dismiss = useCallback(() => setIsDismissed(true), [setIsDismissed]);

  return {
    isDismissed,
    dismiss,
  };
}
