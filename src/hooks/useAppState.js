import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function useAppState() {
  const currentState = AppState.currentState;
  const [appState, setAppState] = useState(currentState);

  function onChange(newState) {
    setAppState(newState);
  }

  useEffect(() => {
    AppState.addEventListener('change', onChange);

    return () => {
      AppState.removeEventListener('change', onChange);
    };
  });

  return appState;
}
