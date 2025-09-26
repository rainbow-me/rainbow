import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export function useDismissedPerpsFeatureCard() {
  const [isDismissedPerpsFeatureCard, setIsDismissedPerpsFeatureCard] = useMMKVBoolean('dismissed-perps-feature-card');

  const setDismissedPerpsFeatureCard = useCallback(() => setIsDismissedPerpsFeatureCard(true), [setIsDismissedPerpsFeatureCard]);

  return {
    isDismissedPerpsFeatureCard,
    setDismissedPerpsFeatureCard,
  };
}
