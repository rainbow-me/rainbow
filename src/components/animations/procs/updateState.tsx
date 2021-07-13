import Animated from 'react-native-reanimated';

export const updateState = Animated.proc(
  (value, dest, finished, position, time, frameTime, toValue) =>
    Animated.block([
      Animated.set(finished, 0),
      Animated.set(time, 0),
      Animated.set(position, value),
      Animated.set(frameTime, 0),
      Animated.set(toValue, dest),
    ])
);
