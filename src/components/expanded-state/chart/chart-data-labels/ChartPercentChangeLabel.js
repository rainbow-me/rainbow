import React from 'react';
import { TextInput } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RowWithMargins } from '../../../layout';
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import { useRatio } from './useRatio';
import { useChartData } from '@rainbow-me/animated-charts';
import styled from '@rainbow-me/styled';
import { fonts, fontWithWidth } from '@rainbow-me/styles';

Animated.addWhitelistedNativeProps({ color: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PercentLabel = styled(AnimatedTextInput)({
  ...fontWithWidth(fonts.weight.bold),
  backgroundColor: ({ theme: { colors } }) => colors.transparent,
  fontSize: fonts.size.big,
  fontVariant: 'tabular-nums',
  letterSpacing: fonts.letterSpacing.roundedTightest,
  textAlign: 'right',
  ...(android ? { marginVertical: -19 } : {}),
});

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

  const defaultValue = !data?.points?.length
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

  const textProps = useAnimatedStyle(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;

    return {
      text:
        firstValue === Number(firstValue) && firstValue
          ? (() => {
              const value =
                originalY?.value === lastValue || !originalY?.value
                  ? latestChange
                  : ((originalY.value || lastValue) / firstValue) * 100 - 100;

              return (
                (android ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') +
                ' ' +
                formatNumber(Math.abs(value).toFixed(2)) +
                '%'
              );
            })()
          : '',
    };
  }, [data]);

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
      {android ? <ChartChangeDirectionArrow ratio={ratio} /> : null}
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
