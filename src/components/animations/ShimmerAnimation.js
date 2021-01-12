import React, { useEffect, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { colors, position } from '@rainbow-me/styles';

const springConfig = {
  damping: 14,
  mass: 1,
  stiffness: 40,
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const ColorGradient = styled(AnimatedLinearGradient).attrs({
  end: { x: 0, y: 0.5 },
  start: { x: 1, y: 0.5 },
})`
  ${position.cover};
`;

export default function ShimmerAnimation({ color, enabled = true, width = 0 }) {
  const opacity = useSharedValue(0.25);
  const positionX = useSharedValue(-width);

  const gradientColors = useMemo(
    () => [
      colors.alpha(color, 0),
      colors.alpha(colors.white, 1),
      colors.alpha(color, 0),
    ],
    [color]
  );

  useEffect(() => {
    if (enabled) {
      opacity.value = withSpring(0.25, springConfig);
      positionX.value = withRepeat(withSpring(width, springConfig), -1);
    } else {
      opacity.value = withSpring(0, springConfig);
      positionX.value = -width;
    }
  }, [enabled, opacity, positionX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: positionX.value }],
  }));

  return <ColorGradient colors={gradientColors} style={animatedStyle} />;
}
