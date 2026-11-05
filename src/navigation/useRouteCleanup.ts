import { useEffect } from 'react';

import useLatestCallback from '@/hooks/useLatestCallback';
import { useNavigation } from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';

/**
 * Runs on unmount only when no route with the same name remains in its navigator.
 * Use at a registered screen's root for state shared between its instances.
 */
export function useRouteCleanup(cleanup: () => void): void {
  const navigation = useNavigation();
  const route = useRoute().name;
  const onCleanup = useLatestCallback(cleanup);

  useEffect(
    () => () => {
      const hasRemainingRoute = navigation.getState().routes.some(entry => entry.name === route);
      if (!hasRemainingRoute) onCleanup();
    },
    [navigation, onCleanup, route]
  );
}
