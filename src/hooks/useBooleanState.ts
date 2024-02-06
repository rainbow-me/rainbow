import { useCallback, useState } from 'react';
import useTimeout from './useTimeout';

export default function useBooleanState(initialStateBoolean = false, duration?: number) {
  const [bool, setBool] = useState(initialStateBoolean);

  const [startTimeout, stopTimeout] = useTimeout();

  const setFalse = useCallback(() => {
    !!duration && stopTimeout();
    setBool(false);
  }, [duration, stopTimeout]);

  const setTrue = useCallback(() => {
    !!duration && stopTimeout();
    setBool(true);
    !!duration && startTimeout(setFalse, duration);
  }, [duration, setFalse, startTimeout, stopTimeout]);

  return [bool, setTrue, setFalse];
}
