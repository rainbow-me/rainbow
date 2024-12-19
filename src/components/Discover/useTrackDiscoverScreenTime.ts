import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useEffect } from 'react';
import Routes from '@/navigation/routesNames';
import { PerformanceTracking, currentlyTrackedMetrics } from '@/performance/tracking';
import { PerformanceMetrics } from '@/performance/tracking/types/PerformanceMetrics';

export const useTrackDiscoverScreenTime = () => {
  const activeSwipeRoute = useNavigationStore(state => state.activeSwipeRoute);
  useEffect(() => {
    const isOnDiscoverScreen = activeSwipeRoute === Routes.DISCOVER_SCREEN;
    const data = currentlyTrackedMetrics.get(PerformanceMetrics.timeSpentOnDiscoverScreen);

    if (!isOnDiscoverScreen && data?.startTimestamp) {
      PerformanceTracking.finishMeasuring(PerformanceMetrics.timeSpentOnDiscoverScreen);
    }

    if (isOnDiscoverScreen) {
      PerformanceTracking.startMeasuring(PerformanceMetrics.timeSpentOnDiscoverScreen);
    }
  }, [activeSwipeRoute]);
};
