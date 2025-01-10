import React, { memo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, AnimatedTextProps } from '@/design-system';
import { useChartData } from '../../helpers/useChartData';

interface ChartLabelProps extends Partial<AnimatedTextProps> {
  formatWorklet: (value: string) => string;
}

const ChartLabelFactory = (fieldName: 'originalX' | 'originalY') => {
  return memo(function ChartLabel({ formatWorklet, ...props }: ChartLabelProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isActive: _, data: __, ...chartData } = useChartData();

    const sharedValue = chartData[fieldName];
    const text = useDerivedValue(() => formatWorklet?.(sharedValue.value) ?? sharedValue.value);

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <AnimatedText numberOfLines={1} size="20pt" weight="bold" {...props}>
        {text}
      </AnimatedText>
    );
  });
};

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
