import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { RowWithMargins } from '../../../layout';
import { useRatio } from './useRatio';
import { useChartData } from '@rainbow-me/animated-charts';
import { colors, fonts } from '@rainbow-me/styles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PercentLabel = styled(AnimatedTextInput)`
  background-color: white;
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.big};
  font-variant: tabular-nums;
  font-weight: ${fonts.weight.bold};
  letter-spacing: ${fonts.letterSpacing.roundedTightest};
  text-align: right;
`;

export default function ChartPercentChangeLabel() {
  const { originalY, data } = useChartData();

  const firstValue = useSharedValue(data?.points?.[0]?.y);
  const lastValue = useSharedValue(data?.points?.[data.points.length - 1]?.y);

  const defaultValue =
    data?.points.length === 0
      ? ''
      : (() => {
          const value =
            ((data?.points?.[data.points.length - 1]?.y ?? 0) /
              data?.points?.[0]?.y) *
              100 -
            100;
          return (
            (value > 0 ? '↑' : value < 0 ? '↓' : '') +
            ' ' +
            Math.abs(value).toFixed(2) +
            '%'
          );
        })();

  useEffect(() => {
    firstValue.value = data?.points?.[0]?.y || 0;
    lastValue.value = data?.points?.[data.points.length - 1]?.y;
  }, [data, firstValue, lastValue]);

  const textProps = useAnimatedStyle(() => {
    return {
      text:
        firstValue.value === Number(firstValue.value) && firstValue.value
          ? (() => {
              const value =
                ((originalY.value || lastValue.value) / firstValue.value) *
                  100 -
                100;
              return (
                (value > 0 ? '↑' : value < 0 ? '↓' : '') +
                ' ' +
                Math.abs(value).toFixed(2) +
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
