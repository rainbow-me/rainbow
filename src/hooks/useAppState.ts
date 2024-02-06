import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import usePrevious from './usePrevious';

const AppStateTypes = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
};

export default function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);
  const prevAppState = usePrevious(appState);

  function onChange(newState: AppStateStatus) {
    setAppState(newState);
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  return {
    appState,
    justBecameActive: appState === AppStateTypes.active && prevAppState && prevAppState !== AppStateTypes.active,
  };
}
