import { useEffect } from 'react';
import { IS_ANDROID } from '@/env';
import { Navigation } from '@/navigation';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import Routes from '@/navigation/routesNames';

export type RouteName = (typeof Routes)[keyof typeof Routes];

export const useRemoveScreen = (screenName: RouteName) => {
  const removeFirst = useRemoveFirst();

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (!IS_ANDROID) {
      return;
    }
    const isScreen = Navigation.getParent()?.getState().routes[0].name === screenName;
    if (isScreen) {
      removeFirst();
    }
  }, [removeFirst, screenName]);
};
