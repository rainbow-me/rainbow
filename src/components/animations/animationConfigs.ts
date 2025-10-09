import { IS_TEST } from '@/env';
import { deepFreeze } from '@/utils/deepFreeze';
import { Easing, EasingFunction, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

// ============ Easing Functions =============================================== //

type EasingTypes = 'bezier' | 'in' | 'inOut' | 'out';
type EasingFunctions = Record<EasingTypes, Record<string, EasingFunction>>;

export const easing = deepFreeze({
  bezier: {
    buttonPress: Easing.bezier(0.25, 0.46, 0.45, 0.94).factory(),
    fade: Easing.bezier(0.22, 1, 0.36, 1).factory(),
  },
  in: {
    cubic: Easing.in(Easing.cubic),
    ease: Easing.in(Easing.ease),
    quad: Easing.in(Easing.quad),
    sin: Easing.in(Easing.sin),
  },
  inOut: {
    cubic: Easing.inOut(Easing.cubic),
    ease: Easing.inOut(Easing.ease),
    quad: Easing.inOut(Easing.quad),
    sin: Easing.inOut(Easing.sin),
  },
  out: {
    cubic: Easing.out(Easing.cubic),
    ease: Easing.out(Easing.ease),
    quad: Easing.out(Easing.quad),
    sin: Easing.out(Easing.sin),
  },
} satisfies EasingFunctions);

// ============ Spring Animations ============================================== //

type SpringConfigs = Record<string, WithSpringConfig>;

const springAnimations = deepFreeze({
  browserTabTransition: { dampingRatio: 0.82, duration: 800 },
  keyboardConfig: { damping: 500, mass: 3, stiffness: 1000 },
  priceChangeConfig: { mass: 0.8, stiffness: 300, damping: 30 },
  sliderConfig: { damping: 40, mass: 1.25, stiffness: 450 },
  slowSpring: { damping: 500, mass: 3, stiffness: 800 },
  snappierSpringConfig: { damping: 42, mass: 0.8, stiffness: 800 },
  snappyMediumSpringConfig: { damping: 70, mass: 0.8, stiffness: 500 },
  snappySpringConfig: { damping: 100, mass: 0.8, stiffness: 275 },
  softerSpringConfig: { damping: 50, mass: 1.2, stiffness: 400 },
  springConfig: { damping: 100, mass: 1.2, stiffness: 750 },
  tabGestureConfig: { damping: 36, mass: 1.4, stiffness: 350 },
  tabSwitchConfig: { damping: 40, mass: 1.25, stiffness: 420 },
  walletDraggableConfig: { damping: 36, mass: 0.8, stiffness: 800 },
} as const satisfies SpringConfigs);

// ============ Timing Animations ============================================== //

type TimingConfigs = Record<string, WithTimingConfig>;

const timingAnimations = deepFreeze({
  buttonPressConfig: { duration: 160, easing: easing.bezier.buttonPress },
  fadeConfig: { duration: 200, easing: easing.bezier.fade },
  fastFadeConfig: { duration: 100, easing: easing.bezier.fade },
  slowFadeConfig: { duration: 300, easing: easing.bezier.fade },
  slowerFadeConfig: { duration: 400, easing: easing.bezier.fade },
  slowestFadeConfig: { duration: 500, easing: easing.bezier.fade },
  tabPressConfig: { duration: 800, easing: easing.bezier.fade },
  zero: { duration: 0, easing: Easing.linear },
} as const satisfies TimingConfigs);

// ============ Helpers ======================================================== //

/**
 * Returns a test-safe, zero-duration animation config if `IS_TEST` is `true`.
 * Otherwise, returns the original config.
 */
export function buildTestSafeConfig<T extends WithSpringConfig | WithTimingConfig>(config: T): T {
  if (!IS_TEST) return config;
  return { ...config, duration: 0 };
}

function buildTestSafeConfigs<S extends SpringConfigs, T extends TimingConfigs>(
  springAnimations: S,
  timingAnimations: T
): { SPRING_CONFIGS: S; TIMING_CONFIGS: T } {
  if (!IS_TEST) return { SPRING_CONFIGS: springAnimations, TIMING_CONFIGS: timingAnimations };

  const zeroed = { SPRING_CONFIGS: { ...springAnimations }, TIMING_CONFIGS: { ...timingAnimations } };
  for (const key in zeroed.SPRING_CONFIGS) buildTestSafeConfig(zeroed.SPRING_CONFIGS[key]);
  for (const key in zeroed.TIMING_CONFIGS) buildTestSafeConfig(zeroed.TIMING_CONFIGS[key]);

  return zeroed;
}

// ============ Exports ======================================================== //

export const { SPRING_CONFIGS, TIMING_CONFIGS } = buildTestSafeConfigs(springAnimations, timingAnimations);
