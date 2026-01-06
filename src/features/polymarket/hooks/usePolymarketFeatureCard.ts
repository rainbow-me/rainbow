import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export function usePolymarketFeatureCard() {
  const [isDismissed, setIsDismissed] = useMMKVBoolean('dismissed-polymarket-feature-card');

  const dismiss = useCallback(() => setIsDismissed(true), [setIsDismissed]);

  return {
    isDismissed,
    dismiss,
  };
}
