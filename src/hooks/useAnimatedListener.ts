import { useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useMemoOne } from 'use-memo-one';

export default function useAnimatedListener(defaultValue = 0) {
  const id = useRef();
  const value = useMemoOne(() => new Animated.Value(defaultValue), [
    defaultValue,
  ]);

  const create = useCallback(
    listener => {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
      id.current = value.addListener(listener);
    },
    [value]
  );

  const remove = useCallback(() => {
    if (id.current) {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
      value.removeListener(id.current);
    }
  }, [value]);

  // remove listener on unmount
  useEffect(() => () => remove(), [remove]);

  return [value, create, remove];
}
