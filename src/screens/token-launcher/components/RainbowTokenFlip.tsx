import {
  BlendColor,
  Blur,
  Canvas,
  Circle,
  Fill,
  Group,
  ImageShader,
  Paint,
  Shadow,
  SkImage,
  SkPath,
  SkPoint,
  SkRect,
  Skia,
  SweepGradient,
  point,
} from '@shopify/react-native-skia';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  makeMutable,
  runOnUI,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { clamp, opacity } from '@/__swaps__/utils/swaps';

interface RainbowCoinEffectProps {
  color: string;
  image: SkImage | SharedValue<SkImage | null>;
  partyMode?: boolean;
  size: number;
}

const RAINBOW_GRADIENTS = {
  AURORA: ['#00FF87', '#00FFE5', '#00C9FF', '#001EFF', '#BD00FF', '#FF0087', '#00FF87'],
  CHROMA: ['#BC77F2', '#00B7FF', '#81DAFF', '#DEC127', '#FF9D53', '#FF6663', '#BC77F2'],
  CHROMATIC: ['#FF1493', '#FF69B4', '#FFB6C1', '#87CEEB', '#4169E1', '#9370DB', '#FF1493'],
  JEWEL: ['#9B2C2C', '#D53F8C', '#805AD5', '#3182CE', '#38A169', '#D69E2E', '#9B2C2C'],
  NEON: ['#FF1E1E', '#FF9C1E', '#FFFF1E', '#1EFF1E', '#1E1EFF', '#FF1EFF', '#FF1E1E'],
  OPAL: ['#40E0D0', '#FF8C69', '#CCCCFF', '#98FB98', '#DDA0DD', '#87CEEB', '#40E0D0'],
} as const;

const ANIMATION_CONFIGS = {
  ROTATE_DURATION: { NORMAL: 15000, PARTY: 12000 },
  TILT_AMPLITUDE_X: { NORMAL: 5, PARTY: -360 },
  TILT_DURATION: { NORMAL: 6000, PARTY: 4000 },
};

const INTERNAL_SPRING_CONFIGS = {
  linearZero: { duration: 0, easing: Easing.linear },
  linearSixSeconds: { duration: 6000, easing: Easing.linear },
  spinSpring: { damping: 100, mass: 0.4, stiffness: 22 },
  spinSpringWithVelocity: { damping: 100, mass: 0.4, stiffness: 22, velocity: 100 },
};

const rotation = makeMutable(0);
const targetRotation = makeMutable<number | undefined>(undefined);
const tiltX = makeMutable(0);
const scale = makeMutable(1);

const resetTiltX = ANIMATION_CONFIGS.TILT_AMPLITUDE_X.PARTY;
function cancelAnimations(animated = false) {
  'worklet';
  if (animated) {
    rotation.value = withTiming(360, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
      if (isFinished && rotation.value === 360) rotation.value = 0;
    });
    targetRotation.value = undefined;
    tiltX.value = withTiming(resetTiltX, TIMING_CONFIGS.slowestFadeConfig, isFinished => {
      if (isFinished && tiltX.value === resetTiltX) tiltX.value = 0;
    });
  } else {
    rotation.value = 0;
    targetRotation.value = undefined;
    tiltX.value = 0;
    scale.value = 1;
  }
}

const BORDER_THICKNESS = 2.6;
const CANVAS_MULTIPLIER = 3;

export const RainbowTokenFlip = memo(function RainbowCoinEffect({ color, image, partyMode = true, size = 40 }: RainbowCoinEffectProps) {
  const { isDarkMode } = useColorMode();

  const [{ randomBlur, smallRandomBlur }] = useState(() => ({
    randomBlur: clamp(Math.random() * 0.8, 0.25, 0.6),
    smallRandomBlur: clamp(Math.random() * 0.8, 0.25, 0.6),
  }));

  const {
    borderThickness,
    canvasCenter,
    dimensionsStyle,
    gradientColors,
    imageRect,
    innerRadius,
    outerRadius,
    rotateDuration,
    tiltAmplitudeX,
  } = useMemo(() => getConfig({ color: getHighContrastColor(color, isDarkMode), size, partyMode }), [color, isDarkMode, size, partyMode]);

  const flipDelay = 1000;
  const circlePath = useMemo(() => getCirclePath(point(canvasCenter, canvasCenter), innerRadius), [canvasCenter, innerRadius]);
  const isAnimating = useSharedValue(false);
  const interval = useDerivedValue(() => (targetRotation?.value === undefined ? undefined : Math.floor(tiltX.value / 180)));

  // Convert rotation to radians for Skia's transform
  const gradientTransform = useDerivedValue(() => {
    const radians = (rotation.value * Math.PI) / 90;
    return [{ rotate: radians }];
  }, [rotation]);

  // Animated style for 3D tilt on the container
  const animatedTiltStyle = useAnimatedStyle(() => {
    return {
      transform: [{ perspective: 80 }, { scale: scale.value }, { rotateY: `${tiltX.value}deg` }],
    };
  });

  const startSpinAnimation = useCallback(
    (extraJuice = 0) => {
      'worklet';
      targetRotation.value = (Math.floor((tiltX.value - 360) / -360) * -360 - 360 - (Math.random() > 0.5 ? 360 : 0)) * (extraJuice + 1);
      tiltX.value = withRepeat(
        withSequence(
          withTiming(0, INTERNAL_SPRING_CONFIGS.linearZero),
          withTiming(0, { duration: flipDelay, easing: Easing.linear }),
          withSpring(-tiltAmplitudeX, INTERNAL_SPRING_CONFIGS.spinSpring)
        ),
        -1,
        true
      );
    },
    [tiltAmplitudeX]
  );

  const startGradientAnimation = useCallback(() => {
    'worklet';
    rotation.value = 0;
    rotation.value = withRepeat(withTiming(360, { duration: rotateDuration, easing: Easing.ease }), -1, false);
  }, [rotateDuration]);

  // Starts animations on mount and cancels them when the expanded state becomes inactive
  useAnimatedReaction(
    () => isAnimating.value,
    (isActive, prevIsActive) => {
      if (isActive && !prevIsActive) {
        startSpinAnimation();
        startGradientAnimation();
      } else if (!isActive && prevIsActive) {
        cancelAnimations(true);
      }
    },
    []
  );

  // Triggers haptics at each 180 degree interval
  useAnimatedReaction(
    () => ({
      interval,
    }),
    (current, prev) => {
      if (prev !== null && current.interval !== undefined && current.interval !== prev.interval) {
        triggerHaptics('soft');
      }
    },
    []
  );

  useEffect(() => {
    isAnimating.value = true;
    const cleanup = () => {
      if (circlePath) circlePath.dispose();
      runOnUI(cancelAnimations)();
    };
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, dimensionsStyle.outer, animatedTiltStyle]}>
      <Canvas style={dimensionsStyle.inner}>
        <Circle cx={canvasCenter} cy={canvasCenter} r={outerRadius - BORDER_THICKNESS} style="stroke" strokeWidth={borderThickness}>
          <Blur blur={randomBlur} />
          <SweepGradient c={point(-canvasCenter / 4, canvasCenter / 3)} colors={gradientColors} transform={gradientTransform} />
          <BlendColor color={opacity(globalColors.grey100, 1)} mode="softLight" />
        </Circle>

        <Circle cx={canvasCenter} cy={canvasCenter} r={innerRadius + BORDER_THICKNESS} style="stroke" strokeWidth={borderThickness}>
          <Blur blur={smallRandomBlur} />
          <Shadow blur={6} color={opacity(globalColors.grey100, 0.4)} dx={0} dy={2} />
          <SweepGradient c={point(canvasCenter / 4, canvasCenter / 3)} colors={gradientColors} transform={gradientTransform} />
          <BlendColor color={opacity(globalColors.grey100, 1)} mode="softLight" />
        </Circle>
        <Circle cx={canvasCenter} cy={canvasCenter} r={innerRadius + 2} color="white" style="fill" blendMode="clear" />

        <Group clip={circlePath}>
          {image && <ImageShader image={image} fit="cover" rect={imageRect} />}
          <Fill color={color} clip={imageRect} blendMode="softLight" />

          <Circle clip={imageRect} cx={canvasCenter} cy={canvasCenter} r={innerRadius}>
            <Paint antiAlias blendMode="plus" clip={imageRect} dither>
              <Shadow blur={2} color={opacity(globalColors.white100, 0.4)} dx={0} dy={1.5} inner shadowOnly />
            </Paint>
            <Paint antiAlias blendMode="softLight" clip={imageRect} dither>
              <Shadow blur={3 / 5} color={globalColors.grey100} dx={0} dy={0.4} inner shadowOnly />
            </Paint>
          </Circle>
        </Group>
      </Canvas>
    </Animated.View>
  );
});

function getConfig({ color, size, partyMode }: { color: string; size: number; partyMode: boolean }) {
  const innerRadius = size / 2 - 1.5;
  const outerRadius = innerRadius + BORDER_THICKNESS;
  const canvasSize = size * CANVAS_MULTIPLIER;
  const canvasCenter = canvasSize / 2;

  const mode = partyMode ? 'PARTY' : 'NORMAL';

  return {
    borderThickness: BORDER_THICKNESS,
    canvasCenter,
    gradientColors: getGradient(color, undefined, true),

    imageRect: {
      height: innerRadius * 2,
      width: innerRadius * 2,
      x: canvasCenter - innerRadius,
      y: canvasCenter - innerRadius,
    } satisfies SkRect,

    innerRadius,
    outerRadius,
    rotateDuration: ANIMATION_CONFIGS.ROTATE_DURATION[mode],
    tiltAmplitudeX: ANIMATION_CONFIGS.TILT_AMPLITUDE_X[mode],
    tiltDuration: ANIMATION_CONFIGS.TILT_DURATION[mode],

    dimensionsStyle: {
      outer: {
        height: size,
        width: size,
        overflow: 'visible',
      } satisfies ViewStyle,
      inner: {
        height: canvasSize,
        width: canvasSize,
      } satisfies ViewStyle,
    },
  };
}

function getCirclePath(center: SkPoint, radius: number): SkPath {
  const svg = `
    M ${center.x + radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x - radius} ${center.y}
    A ${radius} ${radius} 0 1 0 ${center.x + radius} ${center.y} Z
  `;
  const path = Skia.Path.MakeFromSVGString(svg);
  if (path === null) {
    throw new Error('Failed to create circle path');
  }
  return path;
}

function getGradient(color?: string, key?: keyof typeof RAINBOW_GRADIENTS, shuffle = true) {
  const gradientKeys = Object.keys(RAINBOW_GRADIENTS) as (keyof typeof RAINBOW_GRADIENTS)[];
  const keyOrShuffled = key ?? gradientKeys[Math.floor(Math.random() * gradientKeys.length)];
  const colors: string[] = [...RAINBOW_GRADIENTS[keyOrShuffled]];
  if (shuffle) {
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
  }
  if (color) {
    // Replace first and last colors with the provided color
    colors[0] = color;
    colors[colors.length - 1] = color;
    // Replace second or second-to-last color with the provided color
    if (Math.random() > 0.5) colors[1] = color;
    else colors[colors.length - 2] = color;
  }
  return colors;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
