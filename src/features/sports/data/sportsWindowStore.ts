import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { getNextMidnight, getSportsWindow } from '@/features/sports/core/browse';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { createTimeStore } from '@/state/time/createTimeStore';

/**
 * A subscribed clock that wakes at local midnight so the Sports schedule can advance to the next day.
 */
export const useSportsTimeStore = createTimeStore(time => getNextMidnight(new Date(time)));

/**
 * The seven-day schedule window beginning today. Rechecks the local date at midnight and on app-state changes
 * so returning from the background picks up a new day. Preserves the window's identity within the same local day.
 */
export const sportsWindowStore = createDerivedStore(
  $ => {
    $(useSportsTimeStore, s => s.currentTime);
    $(useAppStateStore, s => s === 'active');

    return getSportsWindow();
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
