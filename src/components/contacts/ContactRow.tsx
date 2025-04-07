import { analytics, analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';

const handlePress = useCallback(() => {
  analyticsV2.track(event.contactPressed, { address });
  onPress?.(address);
}, [address, onPress]);
