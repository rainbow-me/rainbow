import { Easing, EntryAnimationsValues, ExitAnimationsValues, withDelay, withTiming } from 'react-native-reanimated';
import { time } from '@/utils/time';

export const customEasing = Easing.bezier(0.2, 0.9, 0.2, 1).factory();
const timingConfig = { duration: time.seconds(1), easing: customEasing };

export function createExitingAnimation(delay = 0) {
  return ({ currentOriginY }: ExitAnimationsValues) => {
    'worklet';

    return {
      initialValues: {
        opacity: 1,
        originY: currentOriginY,
        transform: [{ scale: 1 }],
      },
      animations: {
        opacity: withDelay(delay, withTiming(0, timingConfig)),
        originY: withDelay(delay, withTiming(currentOriginY + 24, timingConfig)),
        transform: [{ scale: withDelay(delay, withTiming(0.96, timingConfig)) }],
      },
    };
  };
}

export function createScaleInFadeInSlideDownEnterAnimation(delay = 0) {
  return ({ targetOriginY }: EntryAnimationsValues) => {
    'worklet';

    return {
      initialValues: {
        opacity: 0,
        originY: targetOriginY - 24,
        transform: [{ scale: 0.96 }],
      },
      animations: {
        opacity: withDelay(delay, withTiming(1, timingConfig)),
        originY: withDelay(delay, withTiming(targetOriginY, timingConfig)),
        transform: [{ scale: withDelay(delay, withTiming(1, timingConfig)) }],
      },
    };
  };
}

export function createScaleInFadeInSlideUpEnterAnimation(delay = 0) {
  return ({ targetOriginY }: EntryAnimationsValues) => {
    'worklet';

    return {
      initialValues: {
        opacity: 0,
        originY: targetOriginY + 24,
        transform: [{ scale: 0.96 }],
      },
      animations: {
        opacity: withDelay(delay, withTiming(1, timingConfig)),
        originY: withDelay(delay, withTiming(targetOriginY, timingConfig)),
        transform: [{ scale: withDelay(delay, withTiming(1, timingConfig)) }],
      },
    };
  };
}
