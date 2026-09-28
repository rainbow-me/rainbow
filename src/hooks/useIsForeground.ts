import { useAppStateStore } from '@/state/appState/appStateStore';

/**
 * Whether the app is in the foreground: React Native's `active` state, not `inactive` or `background`.
 */
export const useIsForeground = (): boolean => useAppStateStore(state => state === 'active');
