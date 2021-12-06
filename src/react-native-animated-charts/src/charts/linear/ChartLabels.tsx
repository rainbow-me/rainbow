import React, { useContext } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';

import ChartContext from '../../helpers/ChartContext';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function ChartLabelFactory(style: any) {
  return function ChartLabel({ format, ...props }: any) {
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'any' cannot be used as an index type.
    const { [style]: val = 0 } = useContext(ChartContext);
    const formattedValue = useDerivedValue(() => {
      return format ? format(val.value) : val.value;
    }, []);
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '() => { text: any; }' is not ass... Remove this comment to see the full error message
    const textProps = useAnimatedStyle(() => {
      return {
        text: formattedValue.value,
      };
    }, []);
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
