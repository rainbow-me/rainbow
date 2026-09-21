import { useEffect } from 'react';

import { shallowEqual, useStableValue } from '@storesjs/stores';

import { sportsActions, useSportsLookupStore } from '@/features/sports/data/sportsStore';
import useAppState from '@/hooks/useAppState';

export function useSportsLookup(eventIds: string[], visible: boolean): { isLoading: boolean; error: Error | null } {
  const owner = useStableValue(() => Symbol('sportsLookup'));
  const { appState } = useAppState();
  const active = visible && appState === 'active';
  useEffect(() => sportsActions.setExactConsumer(owner, eventIds, active), [owner, eventIds, active]);
  useEffect(() => () => sportsActions.removeExactConsumer(owner), [owner]);
  return useSportsLookupStore(state => ({ isLoading: state.getStatus('isLoading'), error: state.error }), shallowEqual);
}
