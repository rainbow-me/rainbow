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

  // slightly randomize duration to avoid sync with other jiggles
  const instanceDuration = duration * (1 + (Math.random() - 0.5) * 0.2); // 10% variance
  // randomize initial rotation direction to avoid sync with other jiggles
  const initialRotation = Math.random() * amplitude;

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
          withTiming(initialRotation, { duration: instanceDuration / 2 }),
          withRepeat(withTiming(-amplitude, { duration: instanceDuration }), -1, true)
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
