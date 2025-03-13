import { SkPath, SkPoint, SkRect, point } from '@shopify/react-native-skia';
import { Easing, SharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors } from '@/design-system';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { opacity } from '@/__swaps__/utils/swaps';
import { generateRainbowGradient } from '@/worklets/gradients';
import { getCirclePath } from '@/worklets/skia';
import { ANIMATION_CONFIGS, CANVAS_VIEW_BUFFER_FACTOR, INTERNAL_SPRING_CONFIGS } from './constants';

interface RainbowCoinEffectConfig {
  canvasCenter: number;
  circlePath: SkPath;
  color: string;
  colors: Record<string, string>;
  dimensionsStyle: { inner: ViewStyle; outer: ViewStyle };
  gradientCenter: SkPoint;
  gradientColors: string[];
  imageRect: SkRect;
  innerRadius: number;
  outerRadius: number;
}

/**
 * #### `🎨 getRainbowCoinEffectConfig 🎨`
 *
 * Returns the configuration for the RainbowCoinEffect component.
 */
export function getRainbowCoinEffectConfig({
  color: providedColor,
  isDarkMode,
  size,
  strokeWidth,
}: {
  color: string;
  isDarkMode: boolean;
  size: number;
  strokeWidth: number;
}): RainbowCoinEffectConfig {
  const color = getHighContrastColor(providedColor, isDarkMode);
  const innerRadius = size / 2;
  const outerRadius = innerRadius + strokeWidth;
  const canvasSize = size * CANVAS_VIEW_BUFFER_FACTOR;
  const canvasCenter = canvasSize / 2;
  const circlePath = getCirclePath(point(canvasCenter, canvasCenter), innerRadius + 0.2);
  const gradientCenter = point(canvasCenter / 4, canvasCenter / 3);

  const colors = {
    blendOverlay: opacity(globalColors.grey100, isDarkMode ? 0.8 : 0.2),
    darkOverlayShadow: opacity(globalColors.grey100, isDarkMode ? 0.6 : 0.1),
    whiteInnerShadow: opacity(globalColors.white100, 0.4),
  };

  const gradientColors = generateRainbowGradient(color, {
    chroma: isDarkMode ? 0.125 : 0.2,
    lightness: isDarkMode ? 0.75 : 0.8,
    numberOfColors: 8,
    strategy: Math.random() > 0.5 ? 'split' : 'complement',
    variance: 5,
  });

  const dimensionsStyle = {
    inner: {
      height: canvasSize,
      width: canvasSize,
    },
    outer: {
      height: size,
      width: size,
      overflow: 'visible',
    } satisfies ViewStyle,
  };

  const imageRect = {
    height: innerRadius * 2 + 0.4,
    width: innerRadius * 2 + 0.4,
    x: canvasCenter - innerRadius - 0.2,
    y: canvasCenter - innerRadius - 0.2,
  };

  return {
    canvasCenter,
    circlePath,
    color,
    colors,
    dimensionsStyle,
    gradientCenter,
    gradientColors,
    imageRect,
    innerRadius,
    outerRadius,
  };
}

export function startAnimations({
  isFirstRender,
  rotation,
  tiltX,
}: {
  isFirstRender: boolean;
  rotation: SharedValue<number>;
  tiltX: SharedValue<number>;
}): void {
  'worklet';
  // Start gradient rotation animation
  rotation.value = 0;
  rotation.value = withRepeat(withTiming(360, { duration: ANIMATION_CONFIGS.ROTATE_DURATION, easing: Easing.ease }), -1, false);

  // Start the 3D coin spin animation
  tiltX.value = -ANIMATION_CONFIGS.TILT_AMPLITUDE_X;

  const repeatingAnimation = withRepeat(
    withSequence(
      withTiming(0, INTERNAL_SPRING_CONFIGS.linearZero),
      withTiming(0, INTERNAL_SPRING_CONFIGS.linearFiveSeconds),
      withSpring(-ANIMATION_CONFIGS.TILT_AMPLITUDE_X, INTERNAL_SPRING_CONFIGS.spinSpring)
    ),
    -1,
    true
  );

  tiltX.value = !isFirstRender
    ? repeatingAnimation
    : withSequence(
        withTiming(0, INTERNAL_SPRING_CONFIGS.linearZero),
        withTiming(0, INTERNAL_SPRING_CONFIGS.initialSpinDelay),
        withSpring(-ANIMATION_CONFIGS.TILT_AMPLITUDE_X, INTERNAL_SPRING_CONFIGS.spinSpring, isFinished => {
          if (isFinished) tiltX.value = repeatingAnimation;
        })
      );
}

export function cancelAnimations({
  animated,
  rotation,
  tiltX,
  targetRotation,
}: {
  animated: boolean;
  rotation: SharedValue<number>;
  targetRotation: SharedValue<number | undefined>;
  tiltX: SharedValue<number>;
}): void {
  'worklet';
  if (animated) {
    rotation.value = withTiming(360, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
      if (isFinished && rotation.value === 360) rotation.value = 0;
    });
    targetRotation.value = undefined;
    tiltX.value = withTiming(ANIMATION_CONFIGS.TILT_AMPLITUDE_X, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
      if (isFinished && tiltX.value === ANIMATION_CONFIGS.TILT_AMPLITUDE_X) tiltX.value = 0;
    });
  } else {
    rotation.value = 0;
    targetRotation.value = undefined;
    tiltX.value = 0;
  }
}

export function onPressCoinIcon({
  extraJuice = 0,
  targetRotation,
  tiltX,
}: {
  extraJuice?: number;
  targetRotation: SharedValue<number | undefined>;
  tiltX: SharedValue<number>;
}): void {
  'worklet';
  targetRotation.value = (Math.floor((tiltX.value - 360) / -360) * -360 - 360 - (Math.random() > 0.5 ? 360 : 0)) * (extraJuice + 1);
  // Freeze the current rotation in place
  const currentRotation = tiltX.value;
  tiltX.value = currentRotation;
  // Immediately restart the animation with the new target rotation
  tiltX.value = withSpring(targetRotation.value, INTERNAL_SPRING_CONFIGS.spinSpring, isFinished => {
    if (isFinished && tiltX.value === targetRotation.value) {
      targetRotation.value = undefined;
      tiltX.value = withRepeat(
        withSequence(
          withTiming(0, INTERNAL_SPRING_CONFIGS.linearZero),
          withTiming(0, INTERNAL_SPRING_CONFIGS.linearFiveSeconds),
          withSpring(-ANIMATION_CONFIGS.TILT_AMPLITUDE_X, INTERNAL_SPRING_CONFIGS.spinSpring)
        ),
        -1,
        true
      );
    }
  });
}
