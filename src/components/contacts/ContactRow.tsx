import { analytics } from '@/analytics';

const handlePress = useCallback(() => {
  analytics.track(analytics.event.contactPressed, { address });
  onPress?.(address);
}, [address, onPress]);
