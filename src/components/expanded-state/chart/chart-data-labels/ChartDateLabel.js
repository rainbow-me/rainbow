import React from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import font from '../../../../styles/fonts';
import { useRatio } from './ChartPercentChangeLabel';
import { colors, fonts } from '@rainbow-me/styles';
import { ChartXLabel } from 'react-native-animated-charts';

const Label = styled(ChartXLabel)`
  background-color: white;
  font-family: ${fonts.family.SFProRounded};
  font-size: ${font.size.larger};
  font-weight: ${font.weight.medium};
  font-variant: tabular-nums;
`;

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

export default function ChartDateLabel({ chartTimeSharedValue }) {
  const ratio = useRatio();

  const textStyle = useAnimatedStyle(() => {
    return {
      color:
        ratio.value === 1
          ? colors.blueGreyDark
          : ratio.value < 1
          ? colors.red
          : colors.green,
    };
  });

  return (
    <>
      <Label
        format={value => {
          'worklet';
          return formatDatetime(value, chartTimeSharedValue);
        }}
        style={textStyle}
      />
    </>
  );
}
