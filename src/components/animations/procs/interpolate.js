import Animated from 'react-native-reanimated';

const interpolateTwo = Animated.proc(
  (value, extrapolate, input1, input2, output1, output2) =>
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2],
      outputRange: [output1, output2],
    })
);

const interpolateThree = Animated.proc(
  (value, extrapolate, input1, input2, input3, output1, output2, output3) =>
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
    Animated.interpolateNode(value, {
      extrapolate,
      inputRange: [input1, input2, input3, input4, input5],
      outputRange: [output1, output2, output3, output4, output5],
    })
);

export default function interpolate(
  value,
  { extrapolate = Animated.Extrapolate.EXTEND, inputRange, outputRange } = {}
) {
  if (inputRange.length === 2) {
    return interpolateTwo(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 3) {
    return interpolateThree(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 4) {
    return interpolateFour(value, extrapolate, ...inputRange, ...outputRange);
  }
  if (inputRange.length === 5) {
    return interpolateFive(value, extrapolate, ...inputRange, ...outputRange);
  }
}
