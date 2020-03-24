import { useCallback, useState } from 'react';
import Animated from 'react-native-reanimated';
import { runSpring } from '../components/animations';

const { Clock, Value } = Animated;

const shake = () => runSpring(new Clock(), -10, 0, -1000, 5500, 35);

export default function useShakeAnimation() {
  const [animation, setAnimation] = useState(new Value(0));
  const onShake = useCallback(() => setAnimation(shake()), []);
  return [animation, onShake];
}
