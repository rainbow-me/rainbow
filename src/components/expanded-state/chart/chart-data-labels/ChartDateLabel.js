import lang from 'i18n-js';
import React from 'react';
import { View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import { useRatio } from './useRatio';
import { ChartXLabel, useChartData } from '@/react-native-animated-charts/src';
import styled from '@/styled-thing';
import { fonts, fontWithWidth } from '@/styles';

const Label = styled(ChartXLabel)({
  ...fontWithWidth(fonts.weight.semibold),
  fontSize: fonts.size.larger,
  fontVariant: ['tabular-nums'],
  letterSpacing: fonts.letterSpacing.roundedMedium,
  textAlign: 'right',
  ...(android ? { marginVertical: -20 } : {}),
});

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

function formatDatetime(value, chartTimeDefaultValue) {
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

export default function ChartDateLabel({ chartTimeDefaultValue, ratio }) {
  const { isActive } = useChartData();
  const sharedRatio = useRatio('ChartDataLabel');
  const { colors } = useTheme();

  const textStyle = useAnimatedStyle(() => {
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      color: realRatio === 1 ? colors.blueGreyDark : realRatio < 1 ? colors.red : colors.green,
    };
  }, [ratio]);

  return (
    <View style={{ overflow: 'hidden' }}>
      <Label
        format={value => {
          'worklet';
          return formatDatetime(value, chartTimeDefaultValue);
        }}
        style={textStyle}
      />
    </View>
  );
}
