import { Canvas, Image, Mask, Rect, useImage } from '@shopify/react-native-skia';
import React, { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
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
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useForegroundColor } from '@/design-system';
import { useCleanup } from '@/hooks/useCleanup';
import { IS_TEST } from '@/env';

export const spinnerExitConfig = TIMING_CONFIGS.slowerFadeConfig;

const enterConfig = { duration: 300 };

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

export const AnimatedSpinner = ({
  color,
  containerStyle,
  idleComponent,
  isLoading,
  requireSrc = require('@/assets/chartSpinner.png'),
  scaleInFrom = 0,
  size = 28,
}: {
  color?: string | SharedValue<string>;
  containerStyle?: StyleProp<ViewStyle>;
  idleComponent?: ReactNode;
  isLoading: boolean | SharedValue<boolean>;
  requireSrc?: string;
  scaleInFrom?: number;
  size?: number;
}) => {
  const isUsingSharedValue = !(typeof isLoading === 'boolean');
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

  const componentStyle = useAnimatedStyle(() => {
    const shouldShow = !(isUsingSharedValue ? isLoading.value : isLoading);
    return {
      pointerEvents: shouldShow ? 'auto' : 'none',
      opacity: 1 - spinnerScale.value,
      transform: [{ scale: 1 - (scaleInFrom + spinnerScale.value * (1 - scaleInFrom)) }],
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
    },
    []
  );

  useCleanup(() => spinnerImage?.dispose?.(), [spinnerImage]);

  if (IS_TEST) {
    return <View style={{ height: size, width: size }} />;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[{ alignItems: 'center', height: size, justifyContent: 'center', position: 'relative', width: size }, containerStyle]}
    >
      <Animated.View pointerEvents="none" style={[spinnerStyle, { height: size, position: 'absolute', width: size }]}>
        <Canvas style={{ height: size, width: size }}>
          <Mask mask={<Image fit="contain" image={spinnerImage} height={size} width={size} />}>
            <Rect color={spinnerColor} rect={{ height: size, width: size, x: 0, y: 0 }} />
          </Mask>
        </Canvas>
      </Animated.View>
      {idleComponent ? (
        <Animated.View
          style={[componentStyle, { alignItems: 'center', height: size, justifyContent: 'center', pointerEvents: 'box-none', width: size }]}
        >
          {idleComponent}
        </Animated.View>
      ) : null}
    </View>
  );
};
