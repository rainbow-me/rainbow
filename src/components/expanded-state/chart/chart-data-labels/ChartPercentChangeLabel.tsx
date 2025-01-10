import React, { memo } from 'react';
import { DerivedValue, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { useTheme } from '@/theme';
import { useRatio } from './useRatio';
import { DataType } from '@/react-native-animated-charts/src/helpers/ChartContext';

function formatNumber(num: string) {
  'worklet';
  const first = num.split('.');
  const digits = first[0].split('').reverse();
  const newDigits = [];
  for (let i = 0; i < digits.length; i++) {
    newDigits.push(digits[i]);
    if ((i + 1) % 3 === 0 && i !== digits.length - 1) {
      newDigits.push(',');
    }
  }
  return newDigits.reverse().join('') + '.' + first[1];
}

const formatWorklet = (originalY: SharedValue<string>, data: DataType, latestChange: number | undefined) => {
  'worklet';
  const firstValue = data?.points?.[0]?.y;
  const lastValue = data?.points?.[data.points.length - 1]?.y;

  return firstValue === Number(firstValue) && firstValue
    ? (() => {
        const originalYNumber = Number(originalY?.value);
        const value =
          originalYNumber === lastValue || !originalYNumber ? latestChange ?? 0 : ((originalYNumber || lastValue) / firstValue) * 100 - 100;

        return (IS_ANDROID ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') + ' ' + formatNumber(Math.abs(value).toFixed(2)) + '%';
      })()
    : '';
};

export default memo(function ChartPercentChangeLabel({
  latestChange,
  ratio,
}: {
  latestChange: DerivedValue<number | undefined>;
  ratio: number | undefined;
}) {
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();

  const sharedRatio = useRatio();
  const text = useDerivedValue(() => formatWorklet(originalY, data, latestChange.value));

  const textStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      color: realRatio !== undefined ? (realRatio === 1 ? colors.blueGreyDark : realRatio < 1 ? colors.red : colors.green) : 'transparent',
    };
  });

  return (
    <AnimatedText
      align="right"
      numberOfLines={1}
      size="23px / 27px (Deprecated)"
      style={[{ width: '100%' }, textStyle]}
      tabularNumbers
      weight="bold"
    >
      {text}
    </AnimatedText>
  );
});
