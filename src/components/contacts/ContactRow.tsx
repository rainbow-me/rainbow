import { analytics, analytics } from '@/analytics';
import { event } from '@/analytics/event';

const handlePress = useCallback(() => {
  analytics.track(event.contactPressed, { address });
  onPress?.(address);
}, [address, onPress]);
