import lang from 'i18n-js';
import React, { useCallback } from 'react';
import Animated, { AnimatedStyle, FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import { useRatio } from './useRatio';
import { ChartXLabel, useChartData } from '@/react-native-animated-charts/src';
import { useTheme } from '@/theme';

const MONTHS = [
  lang.t('expanded_state.chart.date.months.month_00'),
  lang.t('expanded_state.chart.date.months.month_01'),
  lang.t('expanded_state.chart.date.months.month_02'),
  lang.t('expanded_state.chart.date.months.month_03'),
  lang.t('expanded_state.chart.date.months.month_04'),
  lang.t('expanded_state.chart.date.months.month_05'),
  lang.t('expanded_state.chart.date.months.month_06'),
  lang.t('expanded_state.chart.date.months.month_07'),
  lang.t('expanded_state.chart.date.months.month_08'),
  lang.t('expanded_state.chart.date.months.month_09'),
  lang.t('expanded_state.chart.date.months.month_10'),
  lang.t('expanded_state.chart.date.months.month_11'),
];

function formatDatetime(value: string, chartTimeDefaultValue: string) {
  'worklet';
  // we have to do it manually due to limitations of reanimated
  if (value === '') {
    return chartTimeDefaultValue;
  }

  const date = new Date(Number(value) * 1000);
  const now = new Date();

  let res = MONTHS[date.getMonth()] + ' ';

  const d = date.getDate();
  if (d < 10) {
    res += '0';
  }
  res += d;

  const y = date.getFullYear();
  const yCurrent = now.getFullYear();
  if (y !== yCurrent) {
    res += ', ' + y;
    return res;
  }

  const h = date.getHours() % 12;
  if (h === 0) {
    res += ' 12:';
  } else {
    if (h < 10) {
      res += ' 0' + h + ':';
    } else {
      res += ' ' + h + ':';
    }
  }

  const m = date.getMinutes();
  if (m < 10) {
    res += '0';
  }
  res += m + ' ';

  if (date.getHours() < 12) {
    res += 'AM';
  } else {
    res += 'PM';
  }

  return res;
}

export default function ChartDateLabel({
  chartTimeDefaultValue,
  ratio,
  showPriceChangeStyle,
}: {
  chartTimeDefaultValue: string;
  ratio: number | undefined;
  showPriceChangeStyle: AnimatedStyle;
}) {
  const { isActive } = useChartData();
  const sharedRatio = useRatio();
  const { colors } = useTheme();

  const textStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      color: realRatio !== undefined ? (realRatio === 1 ? colors.blueGreyDark : realRatio < 1 ? colors.red : colors.green) : 'transparent',
    };
  });

  const formatWorklet = useCallback(
    (value: string) => {
      'worklet';
      return formatDatetime(value, chartTimeDefaultValue);
    },
    [chartTimeDefaultValue]
  );

  return (
    <Animated.View entering={FadeIn.duration(140)} style={showPriceChangeStyle}>
      <ChartXLabel align="right" formatWorklet={formatWorklet} size="20pt" style={textStyle} tabularNumbers weight="semibold" />
    </Animated.View>
  );
}
