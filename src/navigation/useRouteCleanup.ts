import { useEffect } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import useLatestCallback from '@/hooks/useLatestCallback';

/**
 * Runs on unmount only when no route with the same name remains in its navigator.
 * Use at a registered screen's root for state shared between its instances.
 */
export function useRouteCleanup(cleanup: () => void): void {
  const navigation = useNavigation();
  const { name } = useRoute();
  const onCleanup = useLatestCallback(cleanup);

  useEffect(
    () => () => {
      const hasRemainingRoute = navigation.getState().routes.some(route => route.name === name);
      if (!hasRemainingRoute) onCleanup();
    },
    [name, navigation, onCleanup]
  );
}
