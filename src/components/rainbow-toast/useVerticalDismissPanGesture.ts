import { useCallback, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue, withSpring } from 'react-native-reanimated';

export const springConfigEnter = { damping: 14, mass: 1, stiffness: 121.6 };

export const springConfigDismiss = {
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 5,
  damping: 20,
  mass: 0.8,
  stiffness: 250,
};

interface UseVerticalDismissPanGestureProps {
  onDismiss: () => void | Promise<void>;
  onStartDismiss?: () => void;
  height?: number;
  upwardSensitivityMultiplier?: number;
  dismissSensitivity?: number;
  dismissTargetY?: number;
}

export function useVerticalDismissPanGesture({
  onDismiss,
  onStartDismiss,
  height = 200,
  upwardSensitivityMultiplier = 2,
  dismissSensitivity = 0.3,
  dismissTargetY = -100,
}: UseVerticalDismissPanGestureProps) {
  const dragY = useSharedValue(0);
  const isDismissed = useSharedValue(false);

  const animateTo = useCallback(
    (toY: number, config = springConfigEnter) => {
      'worklet';
      dragY.value = withSpring(toY, config);
    },
    [dragY]
  );

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .simultaneousWithExternalGesture(Gesture.Pan())
      .shouldCancelWhenOutside(false)
      .activeOffsetY([-10, 10])
      .failOffsetX([-30, 30])
      .onUpdate(e => {
        'worklet';
        const rawTranslation = e.translationY;
        // friction as you drag down
        if (rawTranslation > 0) {
          // reduce movement as distance increases
          const friction = 0.05; // lower = more friction
          dragY.value = rawTranslation * friction + (rawTranslation * (1 - friction)) / (1 + rawTranslation * 0.01);
        } else {
          dragY.value = rawTranslation;
        }
      })
      .onEnd(e => {
        'worklet';
        const dragDistance = dragY.value;
        const adjustedDistance = dragDistance < 0 ? dragDistance * upwardSensitivityMultiplier : dragDistance;
        const distanceRatio = Math.abs(adjustedDistance) / height;
        const velocityFactor = Math.abs(e.velocityY) / 1000;
        const dismissScore = distanceRatio + velocityFactor;
        const shouldDismiss = dismissScore > dismissSensitivity;

        if (shouldDismiss) {
          onStartDismiss?.();
          isDismissed.value = true;
          dragY.value = withSpring(dismissTargetY, springConfigDismiss, () => {
            runOnJS(onDismiss)();

            // reset state now since its fully dismissed
            dragY.value = withSpring(0, springConfigEnter);
            isDismissed.value = false;
          });
        } else {
          dragY.value = withSpring(0, springConfigEnter);
        }
      });
  }, [dragY, upwardSensitivityMultiplier, height, dismissSensitivity, onStartDismiss, isDismissed, dismissTargetY, onDismiss]);

  return {
    dragY,
    isDismissed,
    panGesture,
    animateTo,
  };
}
