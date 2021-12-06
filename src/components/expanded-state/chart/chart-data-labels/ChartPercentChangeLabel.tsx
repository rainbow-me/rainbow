import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { RowWithMargins } from '../../../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ChartChangeDirectionArrow' was resolved ... Remove this comment to see the full error message
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import { useRatio } from './useRatio';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { useChartData } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

Animated.addWhitelistedNativeProps({ color: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PercentLabel = styled(AnimatedTextInput)`
  ${fontWithWidth(fonts.weight.bold)};
  background-color: ${({ theme: { colors } }) => colors.transparent};
  font-size: ${fonts.size.big};
  font-variant: tabular-nums;
  letter-spacing: ${fonts.letterSpacing.roundedTightest};
  text-align: right;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android && `margin-vertical: -19px;`}
`;

function formatNumber(num: any) {
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

export default function ChartPercentChangeLabel({
  overrideValue = false,
  latestChange,
}: any) {
  const { originalY, data } = useChartData();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const firstValue = useSharedValue(data?.points?.[0]?.y);
  const lastValue = useSharedValue(data?.points?.[data.points.length - 1]?.y);

  const defaultValue =
    data?.points.length === 0
      ? ''
      : (() => {
          const value = overrideValue
            ? latestChange
            : ((data?.points?.[data.points.length - 1]?.y ?? 0) /
                data?.points?.[0]?.y) *
                100 -
              100;
          if (isNaN(value)) {
            return '';
          }
          return (
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            (android ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') +
            ' ' +
            formatNumber(Math.abs(value).toFixed(2)) +
            '%'
          );
        })();

  useEffect(() => {
    firstValue.value = data?.points?.[0]?.y || 0;
    lastValue.value = data?.points?.[data.points.length - 1]?.y;
  }, [data, firstValue, lastValue, latestChange, overrideValue]);

  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '() => { text: string; }' is not ... Remove this comment to see the full error message
  const textProps = useAnimatedStyle(() => {
    return {
      text:
        firstValue.value === Number(firstValue.value) && firstValue.value
          ? (() => {
              const value =
                originalY?.value === lastValue?.value || !originalY?.value
                  ? latestChange
                  : ((originalY.value || lastValue.value) / firstValue.value) *
                      100 -
                    100;

              return (
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
                (android ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') +
                ' ' +
                formatNumber(Math.abs(value).toFixed(2)) +
                '%'
              );
            })()
          : '',
    };
  });

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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <RowWithMargins align="center" margin={4}>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android ? <ChartChangeDirectionArrow /> : null}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PercentLabel
        alignSelf="flex-end"
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        animatedProps={textProps}
        defaultValue={defaultValue}
        editable={false}
        style={textStyle}
      />
    </RowWithMargins>
  );
}
