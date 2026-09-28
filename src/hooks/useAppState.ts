import { type AppStateStatus } from 'react-native';

import { useAppStateStore } from '@/state/appState/appStateStore';

import usePrevious from './usePrevious';

const AppStateTypes = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
};

/**
 * Returns the native app state and whether it became active since the preceding render.
 * `justBecameActive` may be undefined on the first render, before a previous state exists.
 */
export default function useAppState(): { appState: AppStateStatus; justBecameActive: boolean | undefined } {
  const appState = useAppStateStore();
  const prevAppState = usePrevious(appState);

  return {
    appState,
    justBecameActive: appState === AppStateTypes.active && prevAppState && prevAppState !== AppStateTypes.active,
  };
}
