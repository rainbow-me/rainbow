import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import usePrevious from '@/hooks/usePrevious';

export default function useAppState({
  onChange,
  onActive,
  onBackground,
}: {
  onChange?(state: AppStateStatus): void;
  onActive?(): void;
  onBackground?(): void;
} = {}) {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const prevAppState = usePrevious<AppStateStatus>(appState);
  const justBecameActive = appState === 'active' && prevAppState !== 'active';
  const justBecameBackground =
    appState === 'background' && prevAppState !== 'background';

  useEffect(() => {
    const { remove } = AppState.addEventListener('change', setAppState);
    return () => remove();
  }, []);

  useEffect(() => {
    if (!prevAppState || prevAppState === appState) return;

    if (justBecameActive && onActive) {
      onActive();
    } else if (justBecameBackground && onBackground) {
      onBackground();
    }

    if (onChange) onChange(appState);
  }, [
    appState,
    prevAppState,
    justBecameActive,
    justBecameBackground,
    onChange,
    onActive,
    onBackground,
  ]);

  return {
    appState,
    justBecameActive,
  };
}
