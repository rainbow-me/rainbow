import { useEffect } from 'react';

import { useStableValue } from '@storesjs/stores';

import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsWindow } from '@/features/sports/ui/useSportsWindow';
import useAppState from '@/hooks/useAppState';
import { type Route } from '@/navigation/routesNames';

/** Reads the visible events while this route is in the foreground. */
export function useSportsLookup(eventIds: string[], route: Route, visible: boolean): Error | null {
  const owner = useStableValue(() => Symbol('sportsLookup'));
  const { appState } = useAppState();
  const active = visible && appState === 'active';
  useSportsWindow(active);
  useEffect(() => sportsActions.setLookupConsumer(owner, route, active ? eventIds : []), [owner, route, eventIds, active]);
  useEffect(() => () => sportsActions.removeLookupConsumer(owner), [owner]);
  return useSportsStore(state => state.getCacheEntry()?.errorInfo?.error ?? null);
}
