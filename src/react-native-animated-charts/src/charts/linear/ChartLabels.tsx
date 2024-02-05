import React, { useMemo } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { useChartData } from '../../helpers/useChartData';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface ChartLabelProps extends TextInputProps {
  format: (value: string) => string;
}

const ChartLabelFactory = (fieldName: 'originalX' | 'originalY') => {
  const ChartLabel = React.memo(({ format, ...props }: ChartLabelProps) => {
    const { isActive, data, ...chartData } = useChartData();
    const val = chartData[fieldName];

    // we need to recreate defaultValue on data change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const defaultValue = useMemo(
      () => format?.(val.value) ?? val.value,
      [format, val, data]
    );

    const textProps = useAnimatedProps(
      () => ({
        text: isActive.value ? format?.(val.value) ?? val.value : defaultValue,
        value: isActive.value ? format?.(val.value) ?? val.value : defaultValue,
      }),
      [data, defaultValue, isActive]
    );

    return (
      <AnimatedTextInput
        {...props}
        animatedProps={textProps}
        defaultValue={defaultValue}
        editable={false}
      />
    );
  });

  ChartLabel.displayName = 'ChartLabel';

  return ChartLabel;
};

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
