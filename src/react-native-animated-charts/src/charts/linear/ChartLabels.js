import React, { useContext } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import ChartContext from '../../helpers/ChartContext';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ChartLabelFactory(style) {
  return function ChartLabel({ format, ...props }) {
    const { [style]: val = 0 } = useContext(ChartContext);
    const formattedValue = useDerivedValue(
      () => {
        return format ? format(val.value) : val.value;
      },
      [],
      style + 'formattedValue'
    );
    const textProps = useAnimatedStyle(
      () => {
        return {
          text: formattedValue.value,
        };
      },
      [],
      style + 'textProps'
    );
    return (
      <AnimatedTextInput
        {...props}
        animatedProps={textProps}
        defaultValue={format ? format(val.value) : val.value}
        editable={false}
      />
    );
  };
}

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
