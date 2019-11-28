import Animated from 'react-native-reanimated';

export const and = Animated.proc((a, b) => Animated.and(a, b));
export const eq = Animated.proc((a, b) => Animated.eq(a, b));
export const greaterThan = Animated.proc((a, b) => Animated.greaterThan(a, b));
export const lessThan = Animated.proc((a, b) => Animated.lessThan(a, b));
export const not = Animated.proc(node => Animated.not(node));
export const or = Animated.proc((a, b) => Animated.or(a, b));
export const set = Animated.proc((node, value) => Animated.set(node, value));

export const contains = (values, value) =>
  values.reduce((acc, v) => or(acc, eq(value, v)), new Animated.Value(0));
