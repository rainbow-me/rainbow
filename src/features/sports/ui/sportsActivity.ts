import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

import { sportsActions, useSportsViewStore } from '@/features/sports/data/sportsStore';

let appStateSubscription: NativeEventSubscription | undefined;
let midnightTimer: ReturnType<typeof setTimeout> | undefined;

export function syncSportsActivity(): void {
  const { hosts, lookupConsumers } = useSportsViewStore.getState();
  const needed = hosts.main.visible || hosts.predictions.visible || [...lookupConsumers.values()].some(consumer => consumer.active);
  if (!needed) {
    appStateSubscription?.remove();
    appStateSubscription = undefined;
    clearTimeout(midnightTimer);
    midnightTimer = undefined;
  } else if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', updateAppActivity);
    updateAppActivity(AppState.currentState);
  }
}

function updateAppActivity(state: AppStateStatus): void {
  clearTimeout(midnightTimer);
  midnightTimer = undefined;
  if (state === 'active') updateCalendar();
  useSportsViewStore.setState({ appActive: state === 'active' });
}

function updateCalendar(): void {
  const now = new Date();
  sportsActions.updateWindow(now);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  midnightTimer = setTimeout(updateCalendar, midnight.getTime() - now.getTime());
}
