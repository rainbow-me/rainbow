import React from 'react';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useForegroundColor } from '@/design-system';
import styled from '@/styled-thing';
import { ImgixImage } from '@/components/images';
import Spinner from '@/assets/chartSpinner.png';

export const spinnerExitConfig = {
  duration: 400,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

const enterConfig = { duration: 300 };

const rotationConfig = {
  duration: 500,
  easing: Easing.linear,
};

const StyledSpinner = styled(ImgixImage).attrs(({ color, size, src }: { color: string; size?: number; src?: typeof Spinner }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  size,
  source: src,
  tintColor: color,
}))({
  height: ({ size }: { size?: number }) => size,
  width: ({ size }: { size?: number }) => size,
});

// TODO: We should also accept a regular boolean as a state variable
export const AnimatedSpinner = ({
  isLoading,
  color,
  scaleInFrom = 0,
  size = 28,
  src = Spinner,
}: {
  isLoading: SharedValue<boolean>;
  color?: string;
  scaleInFrom?: number;
  size?: number;
  src?: typeof Spinner;
}) => {
  const labelSecondary = useForegroundColor('labelSecondary');

  const spinnerRotation = useSharedValue(0);
  const spinnerScale = useSharedValue(0);

  useAnimatedReaction(
    () => isLoading.value,
    (isLoadingCurrent, isLoadingPrevious) => {
      if (isLoadingCurrent !== isLoadingPrevious) {
        if (isLoadingCurrent) {
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
    [isLoading]
  );

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      opacity: spinnerScale.value,
      transform: [{ rotate: `${spinnerRotation.value}deg` }, { scale: scaleInFrom + spinnerScale.value * (1 - scaleInFrom) }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={spinnerStyle}>
      <StyledSpinner color={color || labelSecondary} size={size} src={src} />
    </Animated.View>
  );
};
