import { useEffect } from 'react';

import { type SportsHost } from '@/features/sports/core/browse';
import { sportsActions } from '@/features/sports/data/sportsStore';
import useAppState from '@/hooks/useAppState';

export function useSportsHost(host: SportsHost, visible: boolean): boolean {
  const { appState } = useAppState();
  const active = visible && appState === 'active';

  useEffect(() => sportsActions.setHostVisibility(host, active), [host, active]);
  useEffect(() => () => sportsActions.releaseHost(host), [host]);

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    function updateDay() {
      const now = new Date();
      sportsActions.updateWindow(now);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(updateDay, midnight.getTime() - now.getTime());
    }
    updateDay();
    return () => clearTimeout(timer);
  }, [active]);
  return active;
}
