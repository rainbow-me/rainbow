import { useEffect } from 'react';
import { IS_ANDROID } from '@/env';
import { useNavigation } from '@/navigation';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import Routes from '@/navigation/routesNames';

export const useRemoveFirstScreen = () => {
  const { getState: dangerouslyGetState, getParent: dangerouslyGetParent } = useNavigation();
  const removeFirst = useRemoveFirst();

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (!IS_ANDROID) {
      return;
    }
    const isWelcomeScreen = dangerouslyGetParent()?.getState().routes[0].name === Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetParent, dangerouslyGetState, removeFirst]);
};
