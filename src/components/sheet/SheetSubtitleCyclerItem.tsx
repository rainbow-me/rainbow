import React, { useLayoutEffect, useMemo } from 'react';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../text';
import { useTheme } from '@rainbow-me/context';
import { position } from '@rainbow-me/styles';

const AnimatedText = Animated.createAnimatedComponent(Text);

interface Props {
  error?: boolean;
  selected?: boolean;
  subtitle: string;
}

const LocalSheetSubtitleCyclerItem = ({ error, selected, subtitle }: Props) => {
  const easing = useMemo(() => Easing[error ? 'out' : 'in'](Easing.ease), [
    error,
  ]);
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
    const colorValue = interpolateColor(
      colorProgress.value,
      [0, 1],
      [colors.blueGreyDark50, colors.brightRed]
    );

    return {
      color: colorValue,
    };
  });

  return (
    <Animated.View {...position.coverAsObject} style={opacityStyle}>
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
    </Animated.View>
  );
};

export const SheetSubtitleCyclerItem = React.memo(LocalSheetSubtitleCyclerItem);
