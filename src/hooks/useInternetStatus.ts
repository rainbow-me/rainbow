import * as NetInfo from '@react-native-community/netinfo';
import isNil from 'lodash/isNil';
import { useCallback, useEffect, useState } from 'react';
import useRefreshAccountData from './useRefreshAccountData';
import { analytics } from '@rainbow-me/analytics';

export default function useInternetStatus() {
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const { refresh } = useRefreshAccountData();
  const onChange = useCallback(
    ({ isInternetReachable: newIsInternetReachable }) => {
      if (!isNil(newIsInternetReachable)) {
        setIsInternetReachable(newIsInternetReachable);
        if (!isInternetReachable && newIsInternetReachable) {
          refresh();
          analytics.track('Reconnected after offline');
        } else {
          analytics.track('Offline / lost connection');
        }
      }
    },
    [isInternetReachable, refresh]
  );

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(onChange);
    return unsubscribe;
  }, [onChange]);

  return isInternetReachable;
}
