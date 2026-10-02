import { type AppStateStatus } from 'react-native';

import { useAppStateStore } from '@/state/appState/appStateStore';

import usePrevious from './usePrevious';

const AppStateTypes = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
};

/**
 * Returns the app state and whether it just became active.
 * `justBecameActive` may be `undefined` on the first render.
 */
export default function useAppState(): { appState: AppStateStatus; justBecameActive: boolean | undefined } {
  const appState = useAppStateStore();
  const prevAppState = usePrevious(appState);

  return {
    appState,
    justBecameActive: appState === AppStateTypes.active && prevAppState && prevAppState !== AppStateTypes.active,
  };
}
