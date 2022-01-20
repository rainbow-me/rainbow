import React, { useMemo } from 'react';
import { TextInput } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
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

const format = (originalY, data, latestChange) => {
  'worklet';
  const firstValue = data?.points?.[0]?.y;
  const lastValue = data?.points?.[data.points.length - 1]?.y;

  return firstValue === Number(firstValue) && firstValue
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
    : '';
};

export default function ChartPercentChangeLabel({ ratio, latestChange }) {
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();
  // we don't want the label to change on latestChange
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaultValue = useMemo(() => format(originalY, data, latestChange), [
    originalY,
    data,
  ]);

  const textProps = useAnimatedStyle(
    () => ({
      text: isActive.value
        ? format(originalY, data, latestChange)
        : defaultValue,
    }),
    [originalY, data, latestChange, isActive]
  );

  const sharedRatio = useRatio();

  const textStyle = useAnimatedStyle(() => {
    1;
    const realRatio = isActive.value ? sharedRatio.value : ratio;
    return {
      color:
        realRatio === 1
          ? colors.blueGreyDark
          : realRatio < 1
          ? colors.red
          : colors.green,
    };
  }, [ratio]);

  return (
    <RowWithMargins align="center" margin={4}>
      {android ? (
        <ChartChangeDirectionArrow ratio={ratio} sharedRatio={sharedRatio} />
      ) : null}
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
