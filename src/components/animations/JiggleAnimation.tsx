import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  useAnimatedReaction,
  SharedValue,
  withSequence,
} from 'react-native-reanimated';

type JiggleAnimationProps = {
  amplitude?: number;
  duration?: number;
  children: React.ReactNode;
  enabled: boolean | SharedValue<boolean>;
};

export function JiggleAnimation({ children, amplitude = 2, duration = 125, enabled }: JiggleAnimationProps) {
  const rotation = useSharedValue(0);
  const internalEnabled = useSharedValue(typeof enabled === 'boolean' ? enabled : false);

  // Randomize some initial values to avoid sync with other jiggles
  // Randomize duration (5% variance)
  const instanceDuration = duration * (1 + (Math.random() - 0.5) * 0.1);

  // Randomize initial rotation that's at least 50% of the amplitude
  const minInitialRotation = amplitude * 0.5;
  const rotationRange = amplitude - minInitialRotation;
  const initialRotation = minInitialRotation + Math.random() * rotationRange;

  // Randomize initial direction
  const initialDirection = Math.random() < 0.5 ? -1 : 1;
  const firstRotation = initialRotation * initialDirection;

  useEffect(() => {
    if (typeof enabled === 'boolean') {
      internalEnabled.value = enabled;
    }
  }, [enabled, internalEnabled]);

  useAnimatedReaction(
    () => {
      return typeof enabled === 'boolean' ? internalEnabled.value : (enabled as SharedValue<boolean>).value;
    },
    enabled => {
      if (enabled) {
        rotation.value = withSequence(
          withTiming(firstRotation, { duration: instanceDuration / 2 }),
          withRepeat(withTiming(-amplitude * initialDirection, { duration: instanceDuration }), -1, true)
        );
      } else {
        cancelAnimation(rotation);
        rotation.value = withTiming(0, { duration: instanceDuration / 2 });
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
