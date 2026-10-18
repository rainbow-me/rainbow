import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export function useRemoveWelcomeScreen() {
  const { getParent } = useNavigation();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const parent = getParent();
    if (!parent) return;

    const state = parent.getState();
    if (state.index === 0 || state.routes[0].name !== Routes.WELCOME_SCREEN) return;

    parent.reset({
      ...state,
      index: state.index - 1,
      routes: state.routes.slice(1),
    });
  }, [getParent]);
}
