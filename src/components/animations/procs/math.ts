import Animated from 'react-native-reanimated';

// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
export const divide = Animated.proc((a, b) => Animated.divide(a, b));
// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
export const multiply = Animated.proc((a, b) => Animated.multiply(a, b));
