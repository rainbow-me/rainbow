import NetInfo from '@react-native-community/netinfo';
import analytics from '@segment/analytics-react-native';
import { isNil } from 'lodash';
import { useEffect, useState } from 'react';

export default function useInternetStatus() {
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(newState => {
      const { isInternetReachable: newIsInternetReachable } = newState;
      if (!isNil(newIsInternetReachable)) {
        setIsInternetReachable(newIsInternetReachable);
        if (!isInternetReachable && newIsInternetReachable) {
          analytics.track('Reconnected after offline');
        } else {
          analytics.track('Offline / lost connection');
        }
      }
    });
    return unsubscribe;
  });

  return isInternetReachable;
}
