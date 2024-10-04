import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { analyticsV2 } from '@/analytics';
import store from '@/redux/store';
import { walletConnectLoadState } from '@/redux/walletconnect';

type AppStateChangeHandlerProps = {
  walletReady: boolean;
};

export function AppStateChangeHandler({ walletReady }: AppStateChangeHandlerProps) {
  const [appState, setAppState] = useState(AppState.currentState);
  const eventSubscription = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (appState === 'background' && nextAppState === 'active') {
        store.dispatch(walletConnectLoadState());
      }
      setAppState(nextAppState);
      analyticsV2.track(analyticsV2.event.appStateChange, {
        category: 'app state',
        label: nextAppState,
      });
    },
    [appState]
  );

  useEffect(() => {
    if (!walletReady) return;

    eventSubscription.current = AppState.addEventListener('change', handleAppStateChange);

    return () => eventSubscription.current?.remove();
  }, [handleAppStateChange, walletReady]);

  return null;
}
