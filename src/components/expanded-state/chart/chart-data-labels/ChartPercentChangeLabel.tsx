import React, { memo, useMemo } from 'react';
import { DerivedValue, SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { useRatio } from './useRatio';

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

const formatWorklet = ({
  firstValue,
  lastValue,
  latestChange,
  originalY,
}: {
  firstValue: number;
  lastValue: number;
  latestChange: number | undefined;
  originalY: SharedValue<string>;
}) => {
  'worklet';
  return firstValue === Number(firstValue) && firstValue
    ? (() => {
        const originalYNumber = Number(originalY?.value);
        const value =
          originalYNumber === lastValue || !originalYNumber ? latestChange ?? 0 : ((originalYNumber || lastValue) / firstValue) * 100 - 100;

        return (IS_ANDROID ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') + ' ' + formatNumber(Math.abs(value).toFixed(2)) + '%';
      })()
    : ' '; // important that string is not empty so that when actual value fills it does not cause a layout shift
};

export default memo(function ChartPercentChangeLabel({
  latestChange,
  ratio,
}: {
  latestChange: DerivedValue<number | undefined>;
  ratio: number | undefined;
}) {
  const { isDarkMode } = useColorMode();
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();

  const labelSecondary = useForegroundColor('labelSecondary');

  const { firstValue, lastValue } = useMemo(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;
    return { firstValue, lastValue };
  }, [data?.points]);

  const sharedRatio = useRatio();
  const text = useDerivedValue(() => formatWorklet({ firstValue, lastValue, latestChange: latestChange.value, originalY }));

  const textStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    const color = realRatio !== undefined ? (realRatio === 1 ? labelSecondary : realRatio < 1 ? colors.red : colors.green) : 'transparent';
    return {
      color: realRatio !== undefined ? (realRatio === 1 ? labelSecondary : realRatio < 1 ? colors.red : colors.green) : 'transparent',
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="heavy">
        {text}
      </AnimatedText>
    </TextShadow>
  );
});
