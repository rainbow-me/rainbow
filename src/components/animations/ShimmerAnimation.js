import React, { useEffect, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { IS_TESTING } from 'react-native-dotenv';

const timingConfig = {
  duration: 2500,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const ColorGradient = styled(AnimatedLinearGradient).attrs({
  end: { x: 0, y: 0.5 },
  start: { x: 1, y: 0.5 },
})(position.coverAsObject);

export default function ShimmerAnimation({
  animationDuration = timingConfig.duration,
  color,
  enabled = true,
  gradientColor = '',
  width = 0,
}) {
  const opacity = useSharedValue(1);
  const positionX = useSharedValue(-width * 1.5);
  const { colors } = useTheme();

  const gradientColors = useMemo(
    () => [colors.alpha(color, 0), gradientColor || colors.alpha(colors.whiteLabel, 0.2), colors.alpha(color, 0)],
    [gradientColor, color, colors]
  );

  useEffect(() => {
    if (enabled) {
      opacity.value = withTiming(1, {
        duration: animationDuration,
        easing: timingConfig.easing,
      });
      positionX.value = withRepeat(
        withTiming(width * 1.5, {
          duration: animationDuration,
          easing: timingConfig.easing,
        }),
        -1
      );
    } else {
      opacity.value = withTiming(0, {
        duration: animationDuration,
        easing: timingConfig.easing,
      });
      positionX.value = -width * 1.5;
    }
  }, [animationDuration, enabled, opacity, positionX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }));

  if (IS_TESTING === 'true') {
    return null;
  }

  return <ColorGradient colors={gradientColors} style={animatedStyle} />;
}
