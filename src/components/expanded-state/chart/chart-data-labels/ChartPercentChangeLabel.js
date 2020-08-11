import React, { useEffect } from 'react';
import { TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import useReactiveSharedValue from '../../../../react-native-animated-charts/useReactiveSharedValue';
import { RowWithMargins } from '../../../layout';
import ChartChangeDirectionArrow from './ChartChangeDirectionArrow';
import { colors, fonts } from '@rainbow-me/styles';
import { useChartData } from 'react-native-animated-charts';

export function useRatio() {
  const { nativeY, data } = useChartData();

  const firstValue = useReactiveSharedValue(data?.points?.[0]?.y);
  const lastValue = useReactiveSharedValue(
    data?.points?.[data.points.length - 1]?.y
  );

  return useDerivedValue(
    () => (nativeY.value || lastValue.value) / firstValue.value
  );
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PercentLabel = styled(AnimatedTextInput)`
  background-color: white;
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.big};
  font-weight: ${fonts.weight.bold};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  text-align: right;
  font-variant: tabular-nums;
`;

export default function ChartPercentChangeLabel({ changeDirection }) {
  const { nativeY, data } = useChartData();

  const firstValue = useSharedValue(data?.points?.[0]?.y);
  const lastValue = useSharedValue(data?.points?.[data.points.length - 1]?.y);

  const defaultValue =
    Math.abs(
      (data?.points?.[data.points.length - 1]?.y / data?.points?.[0]?.y) * 100 -
        100
    ).toFixed(2) + '%';

  useEffect(() => {
    firstValue.value = data?.points?.[0]?.y;
    lastValue.value = data?.points?.[data.points.length - 1]?.y;
  }, [data, firstValue, lastValue]);

  const textProps = useAnimatedStyle(() => {
    return {
      text:
        Math.abs(
          (firstValue.value &&
            (nativeY.value || lastValue.value) / firstValue.value) *
            100 -
            100
        ).toFixed(2) + '%',
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

  const arrowWrapperStyle = useAnimatedStyle(() => {
    return {
      opacity: ratio.value === 1 ? 0 : 1,
      transform: [{ rotate: ratio.value < 1 ? '180deg' : '0deg' }],
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    return {
      backgroundColor:
        ratio.value === 1
          ? colors.blueGreyDark
          : ratio.value < 1
          ? colors.red
          : colors.green,
    };
  });

  return (
    <RowWithMargins align="center" margin={4}>
      <ChartChangeDirectionArrow
        arrowStyle={arrowStyle}
        changeDirection={changeDirection}
        style={arrowWrapperStyle}
      />
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
