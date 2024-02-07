import React, { useLayoutEffect } from 'react';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../text';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';

const AnimatedText = Animated.createAnimatedComponent(Text);

const Container = styled(Animated.View)({ ...position.coverAsObject });

interface Props {
  error?: boolean;
  selected?: boolean;
  subtitle: string;
}

const LocalSheetSubtitleCyclerItem = ({ error, selected, subtitle }: Props) => {
  const easing = Easing[error ? 'out' : 'in'](Easing.ease);
  const opacity = useSharedValue(selected ? 1 : 0);
  const colorProgress = useSharedValue(error ? 1 : 0);

  useLayoutEffect(() => {
    opacity.value = withTiming(selected ? 1 : 0, {
      duration: 200,
      easing,
    });
    colorProgress.value = withTiming(error ? 1 : 0, {
      duration: error ? 50 : 200,
    });
  }, [selected, error, colorProgress, easing, opacity]);

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const { colors } = useTheme();

  const colorProps = useAnimatedProps(() => {
    const colorValue = interpolateColor(colorProgress.value, [0, 1], [colors.blueGreyDark50, colors.brightRed]);

    return {
      color: colorValue,
    };
  });

  return (
    <Container style={opacityStyle}>
      <AnimatedText
        align="center"
        // @ts-expect-error untyped JS component
        animatedProps={colorProps}
        letterSpacing="uppercase"
        size="smedium"
        uppercase
        weight="semibold"
      >
        {subtitle}
      </AnimatedText>
    </Container>
  );
};

export const SheetSubtitleCyclerItem = React.memo(LocalSheetSubtitleCyclerItem);
