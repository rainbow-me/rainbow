import Animated from 'react-native-reanimated';
import { set } from './operators';

export const updateState = Animated.proc(
  (value, dest, finished, position, time, frameTime, toValue) =>
    Animated.block([
      set(finished, 0),
      set(time, 0),
      set(position, value),
      set(frameTime, 0),
      set(toValue, dest),
    ])
);
