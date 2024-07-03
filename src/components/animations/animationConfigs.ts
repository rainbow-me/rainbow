import { IS_TESTING } from 'react-native-dotenv';
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
  browserTabTransition: { dampingRatio: 0.82, duration: IS_TESTING ? 0 : 800 },
  keyboardConfig: { damping: 500, mass: 3, stiffness: IS_TESTING ? 0 : 1000 },
  sliderConfig: { damping: 40, mass: 1.25, stiffness: IS_TESTING ? 0 : 450 },
  slowSpring: { damping: 500, mass: 3, stiffness: IS_TESTING ? 0 : 800 },
  snappierSpringConfig: { damping: 42, mass: 0.8, stiffness: IS_TESTING ? 0 : 800 },
  snappySpringConfig: { damping: 100, mass: 0.8, stiffness: IS_TESTING ? 0 : 275 },
  springConfig: { damping: 100, mass: 1.2, stiffness: IS_TESTING ? 0 : 750 },
});

export const SPRING_CONFIGS: Record<keyof typeof springAnimations, WithSpringConfig> = springAnimations;
//
// /---- END ----/ //

// /---- ⏱️ Timing Animations ⏱️ ----/ //
//
const timingAnimations = createTimingConfigs({
  buttonPressConfig: { duration: IS_TESTING ? 0 : 160, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) },
  fadeConfig: { duration: IS_TESTING ? 0 : 200, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  fastFadeConfig: { duration: IS_TESTING ? 0 : 100, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowFadeConfig: { duration: IS_TESTING ? 0 : 300, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowerFadeConfig: { duration: IS_TESTING ? 0 : 400, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  slowestFadeConfig: { duration: IS_TESTING ? 0 : 500, easing: Easing.bezier(0.22, 1, 0.36, 1) },
  tabPressConfig: { duration: IS_TESTING ? 0 : 800, easing: Easing.bezier(0.22, 1, 0.36, 1) },
});

export const TIMING_CONFIGS: Record<keyof typeof timingAnimations, WithTimingConfig> = timingAnimations;
//
// /---- END ----/ //
