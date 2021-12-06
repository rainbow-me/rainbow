import React from 'react';
import { View } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import styled from 'styled-components';
import { useRatio } from './useRatio';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartXLabel } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const Label = styled(ChartXLabel)`
  ${fontWithWidth(fonts.weight.semibold)};
  font-size: ${fonts.size.larger};
  font-variant: tabular-nums;
  letter-spacing: ${fonts.letterSpacing.roundedMedium};
  text-align: right;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && `margin-vertical: -20px`}
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

function formatDatetime(value: any, chartTimeSharedValue: any) {
  'worklet';
  // we have to do it manually due to limitations of reanimated
  if (value === '') {
    return chartTimeSharedValue.value;
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

export default function ChartDateLabel({ chartTimeSharedValue }: any) {
  // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
  const ratio = useRatio('ChartDataLabel');
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View style={{ overflow: 'hidden' }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Label
        format={(value: any) => {
          'worklet';
          return formatDatetime(value, chartTimeSharedValue);
        }}
        style={textStyle}
      />
    </View>
  );
}
