import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { getNextMidnight, getSportsWindow } from '@/features/sports/core/browse';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { createTimeStore } from '@/state/time/createTimeStore';

/**
 * A clock that updates at local midnight.
 */
export const useSportsTimeStore = createTimeStore(time => getNextMidnight(new Date(time)));

/**
 * The seven-day Sports schedule window, refreshed at local midnight and on app resume.
 */
export const sportsWindowStore = createDerivedStore(
  $ => {
    $(useSportsTimeStore, s => s.currentTime);
    $(useAppStateStore, s => s === 'active');

    return getSportsWindow();
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
