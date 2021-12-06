import Animated from 'react-native-reanimated';

export const divide = Animated.proc((a, b) => Animated.divide(a, b));
export const multiply = Animated.proc((a, b) => Animated.multiply(a, b));
