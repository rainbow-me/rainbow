import { useAppStateStore } from '@/state/appState/appStateStore';

/**
 * Returns whether the app is active.
 */
export const useIsForeground = (): boolean => useAppStateStore(s => s === 'active');
