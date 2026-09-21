import { useEffect } from 'react';

import { type SportsHost } from '@/features/sports/core/browse';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import { useCleanup } from '@/hooks/useCleanup';

export function useSportsHost(host: SportsHost, visible: boolean): void {
  useEffect(() => {
    sportsActions.setHostVisibility(host, visible);
    syncSportsActivity();
  }, [host, visible]);

  useCleanup(() => {
    sportsActions.setHostVisibility(host, false);
    syncSportsActivity();
  }, [host]);
}
