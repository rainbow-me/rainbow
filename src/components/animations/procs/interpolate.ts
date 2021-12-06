import Animated from 'react-native-reanimated';

const interpolateTwo = Animated.proc(
  (value, extrapolate, input1, input2, output1, output2) =>
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2],
      outputRange: [output1, output2],
    })
);

const interpolateThree = Animated.proc(
  (value, extrapolate, input1, input2, input3, output1, output2, output3) =>
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2, input3],
      outputRange: [output1, output2, output3],
    })
);

const interpolateFour = Animated.proc(
  (
    value,
    extrapolate,
    input1,
    input2,
    input3,
    input4,
    output1,
    output2,
    output3,
    output4
  ) =>
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2, input3, input4],
      outputRange: [output1, output2, output3, output4],
    })
);

const interpolateFive = Animated.proc(
  (
    value,
    extrapolate,
    input1,
    input2,
    input3,
    input4,
    input5,
    output1,
    output2,
    output3,
    output4,
    output5
  ) =>
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2, input3, input4, input5],
      outputRange: [output1, output2, output3, output4, output5],
    })
);

export default function interpolate(
  value: any,
  {
    extrapolate = Animated.Extrapolate.EXTEND,
    inputRange,
    outputRange,
  }: any = {}
) {
  if (inputRange.length === 2) {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 6 arguments, but got 3 or more.
    return interpolateTwo(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 3) {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 8 arguments, but got 3 or more.
    return interpolateThree(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 4) {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 10 arguments, but got 3 or more.
    return interpolateFour(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 5) {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 12 arguments, but got 3 or more.
    return interpolateFive(value, extrapolate, ...inputRange, ...outputRange);
  }
}
