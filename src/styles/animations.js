import { Animated } from 'react-native';

const keyframes = {
  badge: {
    from: { scale: 0, translateY: 1 },
    to: { scale: 1, translateY: 0 },
  },
  button: {
    from: { scale: 1 },
    to: { scale: 0.86 },
  },
};

const spring = {
  badge: {
    friction: 13,
    tension: 145,
  },
  default: {
    friction: 44,
    tension: 600,
  },
};

const buildSpring = ({
  config,
  from,
  isActive,
  to,
  useNativeDriver = true,
  value,
}) => (
  Animated.spring(value, {
    ...spring.default,
    toValue: isActive ? to : from,
    useNativeDriver,
    ...config,
  })
);

export default {
  buildSpring,
  keyframes,
  spring,
};
