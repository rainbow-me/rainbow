import { useEffect } from 'react';

import { shallowEqual, useStableValue } from '@storesjs/stores';

import { sportsActions, useSportsLookupStore } from '@/features/sports/data/sportsStore';
import useAppState from '@/hooks/useAppState';

/** Retains mounted events and refreshes their visible subset while the consumer is active. */
export function useSportsLookup(
  eventIds: string[],
  visible: boolean,
  visibleEventIds = eventIds
): { isLoading: boolean; error: Error | null } {
  const owner = useStableValue(() => Symbol('sportsLookup'));
  const { appState } = useAppState();
  const active = visible && appState === 'active';
  useEffect(
    () => sportsActions.setExactConsumer(owner, eventIds, active ? visibleEventIds : []),
    [owner, eventIds, visibleEventIds, active]
  );
  useEffect(() => () => sportsActions.removeExactConsumer(owner), [owner]);
  return useSportsLookupStore(state => ({ isLoading: state.getStatus('isLoading'), error: state.error }), shallowEqual);
}
