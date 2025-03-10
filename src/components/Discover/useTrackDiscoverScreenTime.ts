import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useEffect } from 'react';
import Routes from '@/navigation/routesNames';
import { PerformanceTracking, currentlyTrackedMetrics } from '@/performance/tracking';
import { PerformanceMetrics } from '@/performance/tracking/types/PerformanceMetrics';

export const useTrackDiscoverScreenTime = () => {
  const isOnDiscoverScreen = useNavigationStore(state => state.isRouteActive(Routes.DISCOVER_SCREEN));
  const activeRoute = useNavigationStore(state => state.activeRoute);

  useEffect(() => {
    const data = currentlyTrackedMetrics.get(PerformanceMetrics.timeSpentOnDiscoverScreen);

    if (!isOnDiscoverScreen && activeRoute !== Routes.NETWORK_SELECTOR && data?.startTimestamp) {
      PerformanceTracking.finishMeasuring(PerformanceMetrics.timeSpentOnDiscoverScreen);
    }

    if (isOnDiscoverScreen) {
      PerformanceTracking.startMeasuring(PerformanceMetrics.timeSpentOnDiscoverScreen);
    }
  }, [isOnDiscoverScreen]);
};
