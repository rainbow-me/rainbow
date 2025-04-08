import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useEffect, useRef } from 'react';
import Routes from '@/navigation/routesNames';
import { usePrevious } from '@/hooks';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';

export const useTrackDiscoverScreenTime = () => {
  const isOnDiscoverScreen = useNavigationStore(state => state.isRouteActive(Routes.DISCOVER_SCREEN));
  const previousIsOnDiscoverScreen = usePrevious(isOnDiscoverScreen);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const activeRoute = useNavigationStore.getState().activeRoute;
    const isOnNetworkSelector = activeRoute === Routes.NETWORK_SELECTOR;

    if (isOnDiscoverScreen && !previousIsOnDiscoverScreen && startTime.current === null) {
      startTime.current = performance.now();
    } else if (!isOnDiscoverScreen && previousIsOnDiscoverScreen && startTime.current && !isOnNetworkSelector) {
      const duration = performance.now() - startTime.current;
      analyticsV2.track(event.timeSpentOnDiscoverScreen, {
        durationInMs: duration,
      });
      startTime.current = null;
    }
  }, [isOnDiscoverScreen, previousIsOnDiscoverScreen]);
};
