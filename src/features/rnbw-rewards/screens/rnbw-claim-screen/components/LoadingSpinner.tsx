import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import { Blur, Canvas, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo } from 'react';
import Animated, { Easing, runOnUI, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const DEFAULT_ANIMATION_DURATION_MS = time.ms(700);
const GLOW_ARC_DEGREES = 10;
const GLOW_BLUR_RADIUS = 4;
const GLOW_EXTENT = GLOW_BLUR_RADIUS * 2;

interface LoadingSpinnerProps {
  color: string;
  size?: number;
  strokeWidth?: number;
}

export const LoadingSpinner = memo(function LoadingSpinner({ color, size = 24, strokeWidth = 2 }: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  const canvasSize = size + GLOW_EXTENT * 2;
  const center = size / 2;
  // Path is inset so the outer edge of the stroke aligns with the view boundary (inner stroke)
  const arcRadius = center - strokeWidth / 2;

  const oval = useMemo(
    () => ({
      x: GLOW_EXTENT + center - arcRadius,
      y: GLOW_EXTENT + center - arcRadius,
      width: arcRadius * 2,
      height: arcRadius * 2,
    }),
    [center, arcRadius]
  );

  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(oval, 0, 180);
    return path;
  }, [oval]);

  const glowArcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(oval, 180 - GLOW_ARC_DEGREES, GLOW_ARC_DEGREES);
    return path;
  }, [oval]);

  const gradientCenter = useMemo(() => vec(GLOW_EXTENT + center + arcRadius, GLOW_EXTENT + center), [center, arcRadius]);

  const startAnimation = useCallback(() => {
    'worklet';
    rotation.value = withRepeat(withTiming(360, { duration: DEFAULT_ANIMATION_DURATION_MS, easing: Easing.linear }), -1, false);
  }, [rotation]);

  useEffect(() => {
    runOnUI(() => {
      startAnimation();
    })();
  }, [startAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: canvasSize, height: canvasSize, margin: -GLOW_EXTENT }, animatedStyle]}>
      <Canvas style={{ width: canvasSize, height: canvasSize }}>
        <Group>
          <Path path={glowArcPath} style="stroke" strokeWidth={strokeWidth} strokeCap="round" color={color} />
          <Blur blur={GLOW_BLUR_RADIUS} />
        </Group>
        <Group>
          <Path path={arcPath} style="stroke" strokeWidth={strokeWidth} strokeCap="round">
            <RadialGradient c={gradientCenter} r={arcRadius * 2} colors={[opacityWorklet(color, 0), color]} positions={[0, 1]} />
          </Path>
        </Group>
      </Canvas>
    </Animated.View>
  );
});
