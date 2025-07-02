import React, { memo } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { AnimatedText, AnimatedTextProps } from '@/design-system';
import { useChartData } from '../../helpers/useChartData';

type ChartLabelProps = Omit<AnimatedTextProps, 'children' | 'selector'> & {
  formatWorklet: (value: SharedValue<string>) => string;
};

const ChartLabelFactory = (fieldName: 'originalX' | 'originalY') => {
  return memo(function ChartLabel({ formatWorklet, size = '20pt', weight = 'bold', ...props }: ChartLabelProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isActive: _, data: __, ...chartData } = useChartData();

    const sharedValue = chartData[fieldName];

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <AnimatedText numberOfLines={1} {...props} size={size} weight={weight} selector={formatWorklet}>
        {sharedValue}
      </AnimatedText>
    );
  });
};

export const ChartYLabel = ChartLabelFactory('originalY');
export const ChartXLabel = ChartLabelFactory('originalX');
