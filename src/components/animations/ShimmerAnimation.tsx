import React, { useEffect, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const timingConfig = {
  duration: 2500,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const ColorGradient = styled(AnimatedLinearGradient).attrs({
  end: { x: 0, y: 0.5 },
  start: { x: 1, y: 0.5 },
})`
  ${position.cover};
`;

export default function ShimmerAnimation({
  color,
  enabled = true,
  gradientColor,
  width = 0,
}: any) {
  const opacity = useSharedValue(1);
  const positionX = useSharedValue(-width * 1.5);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const gradientColors = useMemo(
    () => [
      colors.alpha(color, 0),
      gradientColor || colors.alpha(colors.whiteLabel, 0.2),
      colors.alpha(color, 0),
    ],
    [gradientColor, color, colors]
  );

  useEffect(() => {
    if (enabled) {
      opacity.value = withTiming(1, timingConfig);
      positionX.value = withRepeat(withTiming(width * 1.5, timingConfig), -1);
    } else {
      opacity.value = withTiming(0, timingConfig);
      positionX.value = -width * 1.5;
    }
  }, [enabled, opacity, positionX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }));

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <ColorGradient colors={gradientColors} style={animatedStyle} />;
}
