import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ChartLabelProps extends TextInputProps {
  format: (value: string) => string;
}

const ChartLabelFactory = (fieldName: 'originalX' | 'originalY') => {
  const ChartLabel = React.memo(({ format, ...props }: ChartLabelProps) => {
    const chartData = useChartData();
    const val = chartData[fieldName];

    const textProps = useAnimatedProps(
      () => ({
        text: format?.(val.value) ?? val.value,
        value: format?.(val.value) ?? val.value,
      }),
      [chartData.data]
    );

    return (
      <AnimatedTextInput
        {...props}
        animatedProps={textProps}
        editable={false}
      />
    );
  });

  ChartLabel.displayName = 'ChartLabel';

  return ChartLabel;
};

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
