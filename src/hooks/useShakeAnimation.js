import { useCallback } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';

const springConfig = {
  damping: 35,
  stiffness: 5500,
  velocity: -1000,
};

export default function useShakeAnimation() {
  const animation = useSharedValue(0);
  const onShake = useCallback(() => {
    animation.value = -10;
    animation.value = withSpring(0, springConfig);
  }, [animation]);

  return [animation, onShake];
}
