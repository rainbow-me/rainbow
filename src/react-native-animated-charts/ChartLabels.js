import React, { useContext } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import ChartContext from './ChartContext';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ChartLabelFactory(style) {
  return function ChartLabel({ format, ...props }) {
    const { [style]: val } = useContext(ChartContext);
    const formattedValue = useDerivedValue(() => {
      return format ? format(val.value) : val.value;
    });
    const textStyle = useAnimatedStyle(() => {
      return {
        text: formattedValue.value,
      };
    });
    return <AnimatedTextInput {...props} animatedProps={textStyle} />;
  };
}

export const ChartYLabel = ChartLabelFactory('nativeY');
export const ChartXLabel = ChartLabelFactory('nativeX');
