import React from 'react';
import Animated from 'react-native-reanimated';
import { ChartXLabel } from '../../../../react-native-animated-charts';
import { Input } from '../../../inputs';
import ChartHeaderSubtitle from './ChartHeaderSubtitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';

const AnimatedSubtitle = Animated.createAnimatedComponent(ChartHeaderSubtitle);

function formatDatetime(value, chartTimeSharedValue) {
  'worklet';
  if (value === '') {
    return chartTimeSharedValue.value;
  }
  const date = new Date(Number(value));
  const s = date.getSeconds();
  const m = date.getMinutes();
  const h = date.getHours();
  const d = date.getDate();
  const n = date.getMonth();
  const y = date.getFullYear();
  return `${y}-${n}-${d} ${h}:${m}:${s}`;
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
