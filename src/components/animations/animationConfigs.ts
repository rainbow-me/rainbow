import { IS_TEST } from '@/env';
import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

function createSpringConfigs<T extends Record<string, WithSpringConfig>>(configs: T): T {
  return configs;
}

function createTimingConfigs<T extends Record<string, WithTimingConfig>>(configs: T): T {
  return configs;
}

// Wrapper function for spring configs
const disableSpringForTesting = (config: WithSpringConfig): WithSpringConfig => {
  if (!IS_TEST) return config;
  return { ...config, damping: undefined, stiffness: undefined, duration: undefined };
};

// Wrapper function for timing configs
const disableTimingForTesting = (config: WithTimingConfig): WithTimingConfig => {
  if (!IS_TEST) return config;
  return { ...config, duration: 0 };
};

// /---- 🍎 Spring Animations 🍎 ----/ //
const springAnimations = createSpringConfigs({
  browserTabTransition: disableSpringForTesting({ dampingRatio: 0.82, duration: 800 }),
  keyboardConfig: disableSpringForTesting({ damping: 500, mass: 3, stiffness: 1000 }),
  sliderConfig: disableSpringForTesting({ damping: 40, mass: 1.25, stiffness: 450 }),
  slowSpring: disableSpringForTesting({ damping: 500, mass: 3, stiffness: 800 }),
  snappierSpringConfig: disableSpringForTesting({ damping: 42, mass: 0.8, stiffness: 800 }),
  snappySpringConfig: disableSpringForTesting({ damping: 100, mass: 0.8, stiffness: 275 }),
  springConfig: disableSpringForTesting({ damping: 100, mass: 1.2, stiffness: 750 }),
});

export const SPRING_CONFIGS: Record<keyof typeof springAnimations, WithSpringConfig> = springAnimations;
// /---- END ----/ //

// /---- ⏱️ Timing Animations ⏱️ ----/ //
const timingAnimations = createTimingConfigs({
  buttonPressConfig: disableTimingForTesting({ duration: 160, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
  fadeConfig: disableTimingForTesting({ duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  fastFadeConfig: disableTimingForTesting({ duration: 100, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowFadeConfig: disableTimingForTesting({ duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowerFadeConfig: disableTimingForTesting({ duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  slowestFadeConfig: disableTimingForTesting({ duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
  tabPressConfig: disableTimingForTesting({ duration: 800, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
});

export const TIMING_CONFIGS: Record<keyof typeof timingAnimations, WithTimingConfig> = timingAnimations;
// /---- END ----/ //
