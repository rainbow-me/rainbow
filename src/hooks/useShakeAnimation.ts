import { useCallback, useState } from 'react';
import { Clock, Value } from 'react-native-reanimated';
import { runSpring } from '../components/animations';

const shake = () => runSpring(new Clock(), -10, 0, -1000, 5500, 35);

export default function useShakeAnimation() {
  const [animation, setAnimation] = useState(new Value(0));
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number>' is not ass... Remove this comment to see the full error message
  const onShake = useCallback(() => setAnimation(shake()), []);
  return [animation, onShake];
}
