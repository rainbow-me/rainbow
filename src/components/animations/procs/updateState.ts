import Animated from 'react-native-reanimated';

export const updateState = Animated.proc(
  (value, dest, finished, position, time, frameTime, toValue) =>
    Animated.block([
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
      Animated.set(finished, 0),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
      Animated.set(time, 0),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
      Animated.set(position, value),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
      Animated.set(frameTime, 0),
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
      Animated.set(toValue, dest),
    ])
);
