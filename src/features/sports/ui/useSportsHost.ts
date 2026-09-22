import { useLayoutEffect } from 'react';

import { useListen } from '@storesjs/stores';

import { type SportsHost } from '@/features/sports/core/browse';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import { useRoute } from '@/navigation/RouteContext';
import { useNavigationStore } from '@/state/navigation/navigationStore';

export function useSportsHost(host: SportsHost): void {
  const route = useRoute().name;

  useListen(
    useNavigationStore,
    s => s.isRouteActive(route),
    active => {
      sportsActions.setHostVisibility(host, active);
      syncSportsActivity();
    },
    { fireImmediately: true }
  );

  useLayoutEffect(
    () => () => {
      sportsActions.setHostVisibility(host, false);
      syncSportsActivity();
    },
    [host]
  );
}
