import { Animated } from 'react-native';

export const transformOrigin = ({ x, y }: any, ...transformations: any[]) => [
  { translateX: x },
  { translateY: y },
  ...transformations,
  { translateX: Animated.multiply(x, -1) },
  { translateY: Animated.multiply(y, -1) },
];
