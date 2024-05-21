import { Easing, WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

function createSpringConfigs<T extends Record<string, WithSpringConfig>>(configs: T): T {
  return configs;
}
function createTimingConfigs<T extends Record<string, WithTimingConfig>>(configs: T): T {
  return configs;
}

// /---- 🍎 Spring Animations 🍎 ----/ //
//
const springAnimations = createSpringConfigs({
  browserTabTransition: { dampingRatio: 0.82, duration: 800 },
  keyboardConfig: { damping: 500, mass: 3, stiffness: 1000 },
  sliderConfig: { damping: 40, mass: 1.25, stiffness: 450 },
  slowSpring: { damping: 500, mass: 3, stiffness: 800 },
  snappierSpringConfig: { damping: 42, mass: 0.8, stiffness: 800 },
  snappySpringConfig: { damping: 100, mass: 0.8, stiffness: 275 },
  springConfig: { damping: 100, mass: 1.2, stiffness: 750 },
});

export const SPRING_CONFIGS: Record<keyof typeof springAnimations, WithSpringConfig> = springAnimations;
//
// /---- END ----/ //

// /---- ⏱️ Timing Animations ⏱️ ----/ //
//
const timingAnimations = createTimingConfigs({
  buttonPressConfig: { duration: 160, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) },
  fadeConfig: { duration: 200, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  fastFadeConfig: { duration: 100, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowFadeConfig: { duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowerFadeConfig: { duration: 400, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowestFadeConfig: { duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  tabPressConfig: { duration: 800, easing: Easing.bezier(0.22, 1, 0.36, 1) },
});

export const TIMING_CONFIGS: Record<keyof typeof timingAnimations, WithTimingConfig> = timingAnimations;
//
// /---- END ----/ //
