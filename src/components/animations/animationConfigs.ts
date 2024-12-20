import { IS_TEST } from '@/env';
import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

function createSpringConfigs<T extends Record<string, WithSpringConfig>>(configs: T): T {
  return configs;
}

function createTimingConfigs<T extends Record<string, WithTimingConfig>>(configs: T): T {
  return configs;
}

type AnyConfig = WithSpringConfig | WithTimingConfig;

export const disableForTestingEnvironment = <T extends AnyConfig>(config: T): T => {
  if (!IS_TEST) return config;
  return {
    ...config,
    duration: 0,
  } as T;
};

// /---- 🍎 Spring Animations 🍎 ----/ //
const springAnimations = createSpringConfigs({
  browserTabTransition: disableForTestingEnvironment({ dampingRatio: 0.82, duration: 800 }),
  keyboardConfig: disableForTestingEnvironment({ damping: 500, mass: 3, stiffness: 1000 }),
  sliderConfig: disableForTestingEnvironment({ damping: 40, mass: 1.25, stiffness: 450 }),
  slowSpring: disableForTestingEnvironment({ damping: 500, mass: 3, stiffness: 800 }),
  walletDraggableConfig: disableForTestingEnvironment({ damping: 36, mass: 0.8, stiffness: 800 }),
  snappierSpringConfig: disableForTestingEnvironment({ damping: 42, mass: 0.8, stiffness: 800 }),
  snappySpringConfig: disableForTestingEnvironment({ damping: 100, mass: 0.8, stiffness: 275 }),
  springConfig: disableForTestingEnvironment({ damping: 100, mass: 1.2, stiffness: 750 }),
  tabGestureConfig: disableForTestingEnvironment({ damping: 36, mass: 1.4, stiffness: 350 }),
  tabSwitchConfig: disableForTestingEnvironment({ damping: 40, mass: 1.25, stiffness: 420 }),
});

export const SPRING_CONFIGS: Record<keyof typeof springAnimations, WithSpringConfig> = springAnimations;
// /---- END ----/ //

// /---- ⏱️ Timing Animations ⏱️ ----/ //
const timingAnimations = createTimingConfigs({
  buttonPressConfig: disableForTestingEnvironment({ duration: 160, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
  fadeConfig: disableForTestingEnvironment({ duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  fastFadeConfig: disableForTestingEnvironment({ duration: 100, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowFadeConfig: disableForTestingEnvironment({ duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowerFadeConfig: disableForTestingEnvironment({ duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowestFadeConfig: disableForTestingEnvironment({ duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  tabPressConfig: disableForTestingEnvironment({ duration: 800, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
});

export const TIMING_CONFIGS: Record<keyof typeof timingAnimations, WithTimingConfig> = timingAnimations;
// /---- END ----/ //
