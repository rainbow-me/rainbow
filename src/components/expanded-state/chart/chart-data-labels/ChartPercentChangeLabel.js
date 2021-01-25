import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { RowWithMargins } from '../../../layout';
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import { useRatio } from './useRatio';
import { useChartData } from '@rainbow-me/animated-charts';
import { colors_NOT_REACTIVE, fonts, fontWithWidth } from '@rainbow-me/styles';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PercentLabel = styled(AnimatedTextInput)`
  ${fontWithWidth(fonts.weight.bold)};
  font-size: ${fonts.size.big};
  font-variant: tabular-nums;
  letter-spacing: ${fonts.letterSpacing.roundedTightest};
  text-align: right;
  margin-vertical: ${android ? -8 : 0};
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
            (android ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') +
            ' ' +
            Math.abs(value).toFixed(2) +
            '%'
          );
        })();

  useEffect(() => {
    firstValue.value = data?.points?.[0]?.y || 0;
    lastValue.value = data?.points?.[data.points.length - 1]?.y;
  }, [data, firstValue, lastValue]);

  const textProps = useAnimatedStyle(
    () => {
      return {
        text:
          firstValue.value === Number(firstValue.value) && firstValue.value
            ? (() => {
                const value =
                  ((originalY.value || lastValue.value) / firstValue.value) *
                    100 -
                  100;
                return (
                  (android ? '' : value > 0 ? '↑' : value < 0 ? '↓' : '') +
                  ' ' +
                  Math.abs(value).toFixed(2) +
                  '%'
                );
              })()
            : '',
      };
    },
    [],
    'ChartPercentChangeLabelTextProps'
  );

  const ratio = useRatio();

  const textStyle = useAnimatedStyle(() => {
    return {
      color:
        ratio.value === 1
          ? colors_NOT_REACTIVE.blueGreyDark
          : ratio.value < 1
          ? colors_NOT_REACTIVE.red
          : colors_NOT_REACTIVE.green,
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
