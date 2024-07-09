import { Canvas, Image, Mask, Rect, useImage } from '@shopify/react-native-skia';
import React from 'react';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';

export const spinnerExitConfig = {
  duration: 400,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const enterConfig = { duration: 300 };

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

export const AnimatedSpinner = ({
  color,
  isLoading,
  requireSrc = require('@/assets/chartSpinner.png'),
  scaleInFrom = 0,
  size = 28,
}: {
  color?: string | SharedValue<string>;
  isLoading: boolean | SharedValue<boolean>;
  requireSrc?: string;
  scaleInFrom?: number;
  size?: number;
}) => {
  const labelSecondary = useForegroundColor('labelSecondary');

  const spinnerImage = useImage(requireSrc);
  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);

  const spinnerColor = useDerivedValue(() => (typeof color === 'string' ? color : color?.value || labelSecondary));
  const spinnerStyle = useAnimatedStyle(() => {
    return {
      opacity: spinnerScale.value,
      transform: [{ rotate: `${spinnerRotation.value}deg` }, { scale: scaleInFrom + spinnerScale.value * (1 - scaleInFrom) }],
    };
  });

  useAnimatedReaction(
    () => (typeof isLoading === 'boolean' ? isLoading : isLoading.value),
    (shouldSpin, previousShouldSpin) => {
      if (shouldSpin !== previousShouldSpin) {
        if (shouldSpin) {
          if (spinnerScale.value === 0) {
            spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
          }
          spinnerScale.value = withTiming(1, enterConfig);
        } else {
          spinnerScale.value = withTiming(0, spinnerExitConfig, isFinished => {
            if (isFinished) {
              spinnerRotation.value = 0;
            }
          });
        }
      }
    }
  );

  return (
    <Animated.View pointerEvents="none" style={[spinnerStyle, { height: size, width: size }]}>
      <Canvas style={{ height: size, width: size }}>
        <Mask mask={<Image fit="contain" image={spinnerImage} height={size} width={size} />}>
          <Rect color={spinnerColor} rect={{ height: size, width: size, x: 0, y: 0 }} />
        </Mask>
      </Canvas>
    </Animated.View>
  );
};
