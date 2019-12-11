import { useNetInfo } from '@react-native-community/netinfo';
import analytics from '@segment/analytics-react-native';
import { useEffect } from 'react';

export default function useInternetStatus() {
  const { isInternetReachable } = useNetInfo();

  useEffect(() => {
    if (isInternetReachable) {
      analytics.track('Reconnected after offline');
    } else {
      analytics.track('Offline / lost connection');
    }
  }, [isInternetReachable]);

  return isInternetReachable;
}
