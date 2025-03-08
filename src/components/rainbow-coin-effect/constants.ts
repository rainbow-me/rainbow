import { Easing } from 'react-native-reanimated';
import { time } from '@/utils';

export const BORDER_THICKNESS = 2;
export const CANVAS_VIEW_BUFFER_FACTOR = 2;

export const ANIMATION_CONFIGS = {
  ROTATE_DURATION: time.seconds(12),
  TILT_AMPLITUDE_X: -360,
  TILT_DURATION: time.seconds(4),
};

export const INTERNAL_SPRING_CONFIGS = {
  initialSpinDelay: { duration: time.seconds(0.5), easing: Easing.linear },
  linearSixSeconds: { duration: time.seconds(5), easing: Easing.linear },
  linearZero: { duration: 0, easing: Easing.linear },
  spinSpring: { damping: 100, mass: 0.4, stiffness: 22 },
  spinSpringWithVelocity: { damping: 100, mass: 0.4, stiffness: 22, velocity: 100 },
};
