import Animated, { Value } from 'react-native-reanimated';

const { eq, or, proc } = Animated;

const containsProc = proc((acc, value, v) => or(acc, eq(value, v)));

export default function contains(values, value) {
  return values.reduce((acc, v) => containsProc(acc, value, v), new Value(0));
}
