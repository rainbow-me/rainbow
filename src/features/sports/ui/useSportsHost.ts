import { useEffect } from 'react';

import { type SportsHost } from '@/features/sports/core/browse';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { useSportsWindow } from '@/features/sports/ui/useSportsWindow';
import useAppState from '@/hooks/useAppState';

export function useSportsHost(host: SportsHost, visible: boolean): boolean {
  const { appState } = useAppState();
  const active = visible && appState === 'active';

  useEffect(() => sportsActions.setHostVisibility(host, active), [host, active]);
  useEffect(() => () => sportsActions.releaseHost(host), [host]);

  useSportsWindow(active);
  return active;
}
