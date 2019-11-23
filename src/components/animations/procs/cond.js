import Animated from 'react-native-reanimated';

const condSingleCase = Animated.proc((conditional, trueCase) =>
  Animated.cond(conditional, trueCase)
);

const condDoubleCase = Animated.proc((conditional, trueCase, falseCase) =>
  Animated.cond(conditional, trueCase, falseCase)
);

export default function cond(conditional, trueCase, falseCase) {
  if (falseCase) {
    return condDoubleCase(conditional, trueCase, falseCase);
  }

  return condSingleCase(conditional, trueCase);
}
