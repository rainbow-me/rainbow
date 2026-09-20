import { useCallback } from 'react';

import { useSharedValue, withSpring, withTiming, type DerivedValue, type WithSpringConfig } from 'react-native-reanimated';
import { triggerHaptics, type HapticType } from 'react-native-turbo-haptics';

const springConfig: WithSpringConfig = {
  damping: 28,
  // Matches the Reanimated 3 termination point for this spring.
  energyThreshold: 2e-7,
  mass: 1.1,
  stiffness: 1600,
};

/**
 * Shake animation utility with optional haptics. The shake function can run in a worklet.
 *
 * @returns a tuple with the translation value and the shake trigger function.
 */
export function useShakeAnimation(displacement = 8): [DerivedValue<number>, (hapticType?: HapticType) => void] {
  const translation = useSharedValue(0);
  const release = useSharedValue(0);

  const shake = useCallback(
    (hapticType?: HapticType) => {
      'worklet';
      translation.value = withSpring(-displacement, springConfig);
      release.value = 0;
      release.value = withTiming(1, { duration: 40 }, finished => {
        if (finished) translation.value = withSpring(0, springConfig);
      });

      if (hapticType) triggerHaptics(hapticType);
    },
    [displacement, release, translation]
  );

  return [translation, shake];
}
