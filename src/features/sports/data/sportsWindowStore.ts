import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { getNextMidnight, getSportsWindow } from '@/features/sports/core/browse';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { createTimeStore } from '@/state/time/createTimeStore';

/**
 * The current time, updated at each local midnight.
 */
export const useSportsTimeStore = createTimeStore(time => getNextMidnight(new Date(time)));

/**
 * The local week Sports shows, starting today. Today changes at midnight, and may have changed while the app was
 * in the background, so the week is read from the clock at each midnight and whenever the app becomes active.
 */
export const sportsWindowStore = createDerivedStore(
  $ => {
    $(useSportsTimeStore, s => s.currentTime);
    $(useAppStateStore, s => s === 'active');

    return getSportsWindow();
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
