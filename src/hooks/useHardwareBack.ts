import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';

/**
 * Hook which will allow us to disable react navigation back behavior on Android
 * and optionally run some callback.
 *
 * Callback can return a boolean which would tell navigation should it run
 * the very next registered back handler or interrupt it
 *
 * So, if we return true - only our handler will be called. False will run our and the next one too.
 * That next one can return true or false too.
 *
 * By default we interrupt the stack only calling our handler.
 *
 * @param {Function} cb - optional callback which will be executed
 */
export default function useHardwareBack(cb: () => boolean | void, shouldSkip = false, deps: unknown[] = []) {
  const callback = useCallback(() => {
    if (shouldSkip) {
      return;
    }

    const handler = () => {
      const handleValue = cb?.() ?? true;

      return handleValue;
    };

    BackHandler.addEventListener('hardwareBackPress', handler);

    return () => BackHandler.removeEventListener('hardwareBackPress', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat(shouldSkip));

  useEffect(callback, [callback]);
}

export function useHardwareBackOnFocus(cb: () => boolean | undefined, shouldSkip = false, deps: unknown[] = []) {
  const callback = useCallback(() => {
    if (shouldSkip) {
      return;
    }

    const handler = () => {
      const handleValue = cb?.() ?? true;

      return handleValue;
    };

    BackHandler.addEventListener('hardwareBackPress', handler);

    return () => BackHandler.removeEventListener('hardwareBackPress', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps.concat(shouldSkip));

  useFocusEffect(callback);
}
