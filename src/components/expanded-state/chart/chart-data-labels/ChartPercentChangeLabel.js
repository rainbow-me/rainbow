import React, { memo } from 'react';
import { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { useRatio } from './useRatio';

function formatNumber(num) {
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

const formatWorklet = (originalY, data, latestChange) => {
  'worklet';
  const firstValue = data?.points?.[0]?.y;
  const lastValue = data?.points?.[data.points.length - 1]?.y;

  return firstValue === Number(firstValue) && firstValue
    ? (() => {
        const value =
          originalY?.value === lastValue || !originalY?.value
            ? parseFloat(latestChange ?? 0)
            : ((originalY.value || lastValue) / firstValue) * 100 - 100;
        const numValue = parseFloat(value);

        return (IS_ANDROID ? '' : numValue > 0 ? '↑' : numValue < 0 ? '↓' : '') + ' ' + formatNumber(Math.abs(numValue).toFixed(2)) + '%';
      })()
    : '';
};

export default memo(function ChartPercentChangeLabel({ ratio, latestChange }) {
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();

  const sharedRatio = useRatio();
  const text = useDerivedValue(() => formatWorklet(originalY, data, latestChange.value));

  const textStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      color: realRatio === 1 ? colors.blueGreyDark : realRatio < 1 ? colors.red : colors.green,
    };
  }, [ratio]);

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
