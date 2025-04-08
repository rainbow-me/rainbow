import { useCallback, useEffect, useRef, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';

function getIsOnline(state: NetInfoState) {
  if (typeof state.isConnected !== 'boolean' || typeof state.isInternetReachable !== 'boolean') {
    return true;
  }
  return state.isConnected && state.isInternetReachable;
}

export default function useIsOffline({ debounceMs = 0 }: { debounceMs?: number } = {}) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const isOnlineRef = useRef<boolean | null>(null);
  const netInfoSubscriptionRef = useRef<NetInfoSubscription | null>(null);
  const offlineTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateIsOnline = useCallback((newIsOnline: boolean) => {
    isOnlineRef.current = newIsOnline;
    setIsOnline(newIsOnline);
  }, []);

  const handleNetworkStateChange = useCallback(
    (state: NetInfoState) => {
      const newIsOnline = getIsOnline(state);
      const oldIsOnline = isOnlineRef.current;

      if (newIsOnline === oldIsOnline || oldIsOnline === null) return;

      if (newIsOnline) {
        // We came back online within the debounce window, clear any pending offline update
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        } else {
          analyticsV2.track(event.networkStatusReconnected);
        }
        updateIsOnline(true);
      } else {
        if (debounceMs > 0) {
          if (!offlineTimerRef.current) {
            offlineTimerRef.current = setTimeout(() => {
              offlineTimerRef.current = null;
              analyticsV2.track(event.networkStatusOffline);
              updateIsOnline(false);
            }, debounceMs);
          }
        } else {
          analyticsV2.track(event.networkStatusOffline);
          updateIsOnline(false);
        }
      }
    },
    [debounceMs, updateIsOnline]
  );

  useEffect(() => {
    async function initIsOnlineSubscription() {
      const netInfoState = await NetInfo.fetch();
      handleNetworkStateChange(netInfoState);

      netInfoSubscriptionRef.current = NetInfo.addEventListener(state => {
        handleNetworkStateChange(state);
      });
    }

    function removeIsOnlineSubscription() {
      if (netInfoSubscriptionRef.current) {
        netInfoSubscriptionRef.current();
        netInfoSubscriptionRef.current = null;
      }
    }

    initIsOnlineSubscription();

    const appStateSubscription = AppState.addEventListener('change', async nextAppState => {
      removeIsOnlineSubscription();
      if (nextAppState === 'active') {
        await initIsOnlineSubscription();
      }
    });

    return () => {
      appStateSubscription.remove();
      removeIsOnlineSubscription();
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };
  }, [handleNetworkStateChange]);

  return isOnline === false;
}
