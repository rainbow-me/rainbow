import { useCallback, useState } from 'react';
import useTimeout from './useTimeout';

export default function useBooleanState(
  initialStateBoolean = false,
  duration: any
) {
  const [bool, setBool] = useState(initialStateBoolean);

  const [startTimeout, stopTimeout] = useTimeout();

  const setFalse = useCallback(() => {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    !!duration && stopTimeout();
    setBool(false);
  }, [duration, stopTimeout]);

  const setTrue = useCallback(() => {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    !!duration && stopTimeout();
    setBool(true);
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    !!duration && startTimeout(setFalse, duration);
  }, [duration, setFalse, startTimeout, stopTimeout]);

  return [bool, setTrue, setFalse];
}
