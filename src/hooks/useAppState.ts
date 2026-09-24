import { useAppStateStore } from '@/state/appState/appStateStore';

import usePrevious from './usePrevious';

const AppStateTypes = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
};

/**
 * The app's state, and whether it just became active.
 */
export default function useAppState() {
  const appState = useAppStateStore();
  const prevAppState = usePrevious(appState);

  return {
    appState,
    justBecameActive: appState === AppStateTypes.active && prevAppState && prevAppState !== AppStateTypes.active,
  };
}
