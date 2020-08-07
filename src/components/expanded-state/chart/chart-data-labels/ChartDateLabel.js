import React from 'react';
import Animated from 'react-native-reanimated';
import { Input } from '../../../inputs';
import ChartHeaderSubtitle from './ChartHeaderSubtitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import { ChartXLabel } from 'react-native-animated-charts';

const AnimatedSubtitle = Animated.createAnimatedComponent(ChartHeaderSubtitle);

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatDatetime(value, chartTimeSharedValue) {
  'worklet';
  // we have to do it manually due to limitations of reanimated
  if (value === '') {
    return chartTimeSharedValue.value;
  }

  const date = new Date(Number(value) * 1000);
  let res = MONTHS[date.getMonth()] + ' ';
  const d = date.getDate();
  if (d < 10) {
    res += '0';
  }
  res += d + ' ';
  const h = date.getHours() % 12;
  if (h < 10) {
    res += '0';
  }
  res += h + ':';

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
  color,
  dateRef,
  chartTimeSharedValue,
}) {
  return (
    <>
      {chartExpandedAvailable ? (
        <AnimatedSubtitle
          align="right"
          as={Input}
          color={color}
          editable={false}
          letterSpacing="roundedTight"
          pointerEvent="none"
          ref={dateRef}
          tabularNums
        />
      ) : (
        <AnimatedSubtitle align="right" color={color}>
          Today
        </AnimatedSubtitle>
      )}
      <ChartXLabel
        format={value => {
          'worklet';
          return formatDatetime(value, chartTimeSharedValue);
        }}
        style={{ backgroundColor: 'white', margin: 4 }}
      />
    </>
  );
}
