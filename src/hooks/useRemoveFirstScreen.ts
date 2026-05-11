import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';

export type RouteName = (typeof Routes)[keyof typeof Routes];

export const useRemoveScreen = (screenName: RouteName) => {
  const { getState: dangerouslyGetState, getParent: dangerouslyGetParent } = useNavigation();
  const removeFirst = useRemoveFirst();

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (Platform.OS !== 'android') {
      return;
    }
    const isScreen = dangerouslyGetParent()?.getState().routes[0].name === screenName;
    if (isScreen) {
      removeFirst();
    }
  }, [dangerouslyGetParent, dangerouslyGetState, removeFirst]);
};
