import { useCallback } from 'react';
import { Easing, type SharedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { LONG_PRESS_DURATION_IN_MS } from '@/components/buttons/hold-to-authorize/constants';

type UseHoldToActivateOptions = {
  onActivate: () => void;
  duration?: number;
  disabled?: boolean;
};

type HoldToActivateGestureProps = {
  longPressDuration: number;
  disabled: boolean;
  onPressStartWorklet: () => void;
  onLongPressWorklet: () => void;
  onLongPressEndWorklet: (success?: boolean) => void;
  onLongPressJS: () => void;
};

type UseHoldToActivateResult = {
  holdProgress: SharedValue<number>;
  gestureHandlerProps: HoldToActivateGestureProps;
};

export function useHoldToActivate({
  onActivate,
  duration = LONG_PRESS_DURATION_IN_MS,
  disabled = false,
}: UseHoldToActivateOptions): UseHoldToActivateResult {
  const holdProgress = useSharedValue(0);

  const onPressStartWorklet = useCallback(() => {
    'worklet';
    holdProgress.value = 0;
    holdProgress.value = withTiming(100, { duration, easing: Easing.inOut(Easing.sin) }, isFinished => {
      if (isFinished) {
        holdProgress.value = 0;
      }
    });
  }, [duration, holdProgress]);

  const onLongPressWorklet = useCallback(() => {
    'worklet';
    triggerHaptics('notificationSuccess');
  }, []);

  const onLongPressEndWorklet = useCallback(
    (success?: boolean) => {
      'worklet';
      if (!success) {
        holdProgress.value = withSpring(0, SPRING_CONFIGS.slowSpring);
      }
    },
    [holdProgress]
  );

  return {
    holdProgress,
    gestureHandlerProps: {
      longPressDuration: duration,
      disabled,
      onPressStartWorklet,
      onLongPressWorklet,
      onLongPressEndWorklet,
      onLongPressJS: onActivate,
    },
  };
}
