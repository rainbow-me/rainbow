import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import usePrevious from './usePrevious';

const AppStateTypes = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
};

export default function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);
  const prevAppState = usePrevious(appState);

  function onChange(newState) {
    setAppState(newState);
  }

  useEffect(() => {
    AppState.addEventListener('change', onChange);
    return () => AppState.removeEventListener('change', onChange);
  }, []);

  return {
    appState,
    justBecameActive:
      appState === AppStateTypes.active &&
      prevAppState &&
      prevAppState !== AppStateTypes.active,
  };
}
