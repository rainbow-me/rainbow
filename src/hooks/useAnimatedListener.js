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
      id.current = value.addListener(listener);
    },
    [value]
  );

  const remove = useCallback(() => {
    if (id.current) {
      value.removeListener(id.current);
    }
  }, [value]);

  // remove listener on unmount
  useEffect(() => () => remove(), [remove]);

  return [value, create, remove];
}
