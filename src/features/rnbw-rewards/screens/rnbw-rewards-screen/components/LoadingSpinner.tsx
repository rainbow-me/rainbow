import { opacity } from '@/data/opacity';
import { time } from '@/utils/time';
import { Blur, Canvas, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo } from 'react';
import Animated, { Easing, runOnUI, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const DEFAULT_ANIMATION_DURATION_MS = time.ms(700);
const DEFAULT_GLOW_ARC_DEGREES = 10;
const DEFAULT_GLOW_BLUR_RADIUS = 4;

interface LoadingSpinnerProps {
  color: string;
  animationDurationMs?: number;
  glowArcDegrees?: number;
  glowBlurRadius?: number;
  size?: number;
  strokeWidth?: number;
}

export const LoadingSpinner = memo(function LoadingSpinner({
  color,
  animationDurationMs = DEFAULT_ANIMATION_DURATION_MS,
  glowArcDegrees = DEFAULT_GLOW_ARC_DEGREES,
  glowBlurRadius = DEFAULT_GLOW_BLUR_RADIUS,
  size = 24,
  strokeWidth = 2,
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  const glowExtent = glowBlurRadius * 2;
  const canvasSize = size + glowExtent * 2;
  const center = size / 2;
  // Path is inset so the outer edge of the stroke aligns with the view boundary (inner stroke)
  const arcRadius = center - strokeWidth / 2;

  const circle = useMemo(
    () => ({
      x: glowExtent + center - arcRadius,
      y: glowExtent + center - arcRadius,
      width: arcRadius * 2,
      height: arcRadius * 2,
    }),
    [center, arcRadius, glowExtent]
  );

  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(circle, 0, 180);
    return path;
  }, [circle]);

  const glowArcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(circle, 180 - glowArcDegrees, glowArcDegrees);
    return path;
  }, [circle, glowArcDegrees]);

  const gradientCenter = useMemo(() => vec(glowExtent + center + arcRadius, glowExtent + center), [center, arcRadius, glowExtent]);

  const startAnimation = useCallback(() => {
    'worklet';
    rotation.value = withRepeat(withTiming(360, { duration: animationDurationMs, easing: Easing.linear }), -1, false);
  }, [animationDurationMs, rotation]);

  useEffect(() => {
    runOnUI(() => {
      startAnimation();
    })();
  }, [startAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: canvasSize, height: canvasSize, margin: -glowExtent }, animatedStyle]}>
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Group>
          <Path path={glowArcPath} style="stroke" strokeWidth={strokeWidth} strokeCap="round" color={color} />
          <Blur blur={glowBlurRadius} />
        </Group>
        <Group>
          <Path path={arcPath} style="stroke" strokeWidth={strokeWidth} strokeCap="round">
            <RadialGradient c={gradientCenter} r={arcRadius * 2} colors={[opacity(color, 0), color]} positions={[0, 1]} />
          </Path>
        </Group>
      </Canvas>
    </Animated.View>
  );
});
