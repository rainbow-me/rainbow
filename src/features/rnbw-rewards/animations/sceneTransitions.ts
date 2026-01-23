import { Easing, EntryAnimationsValues, ExitAnimationsValues, withDelay, withTiming } from 'react-native-reanimated';
import { time } from '@/utils/time';

export const transitionEasing = Easing.bezier(0.2, 0.9, 0.2, 1).factory();
const timingConfig = { duration: time.seconds(1), easing: transitionEasing };

type AnimationConfig = {
  delay?: number;
  translateY?: number;
  scale?: number;
};

export function createScaleOutFadeOutSlideExitAnimation({ delay = 0, translateY = 24, scale = 0.96 }: AnimationConfig = {}) {
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
        originY: withDelay(delay, withTiming(currentOriginY + translateY, timingConfig)),
        transform: [{ scale: withDelay(delay, withTiming(scale, timingConfig)) }],
      },
    };
  };
}

export function createScaleInFadeInSlideEnterAnimation({ delay = 0, translateY = 24, scale = 0.96 }: AnimationConfig = {}) {
  return ({ targetOriginY }: EntryAnimationsValues) => {
    'worklet';

    return {
      initialValues: {
        opacity: 0,
        originY: targetOriginY + translateY,
        transform: [{ scale: scale }],
      },
      animations: {
        opacity: withDelay(delay, withTiming(1, timingConfig)),
        originY: withDelay(delay, withTiming(targetOriginY, timingConfig)),
        transform: [{ scale: withDelay(delay, withTiming(1, timingConfig)) }],
      },
    };
  };
}

export const defaultExitAnimation = createScaleOutFadeOutSlideExitAnimation();
export const defaultEnterAnimation = createScaleInFadeInSlideEnterAnimation();
