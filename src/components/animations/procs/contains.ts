import Animated, { Value } from 'react-native-reanimated';

const { eq, or, proc } = Animated;

// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
const containsProc = proc((acc, value, v) => or(acc, eq(value, v)));

export default function contains(values: any, value: any) {
  return values.reduce(
    (acc: any, v: any) => containsProc(acc, value, v),
    new Value(0)
  );
}
