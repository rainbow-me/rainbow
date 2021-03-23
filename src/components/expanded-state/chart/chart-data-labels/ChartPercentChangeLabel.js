import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { RowWithMargins } from '../../../layout';
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import { useRatio } from './useRatio';
import { useChartData } from '@rainbow-me/animated-charts';
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
  ${android && `margin-vertical: -19px;`}
`;

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

export default function ChartPercentChangeLabel({
  overrideValue = false,
  latestChange,
}) {
  const { originalY, data } = useChartData();
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
    <RowWithMargins align="center" margin={4}>
      {android ? <ChartChangeDirectionArrow /> : null}
      <PercentLabel
        alignSelf="flex-end"
        animatedProps={textProps}
        defaultValue={defaultValue}
        editable={false}
        style={textStyle}
      />
    </RowWithMargins>
  );
}
