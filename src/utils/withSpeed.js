import { defineAnimation } from 'react-native-reanimated';

export default function withSpeed(userConfig) {
  'worklet';

  return defineAnimation(0, () => {
    'worklet';
    const config = {
      speed: 100,
    };
    if (userConfig) {
      Object.keys(userConfig).forEach(key => (config[key] = userConfig[key]));
    }

    function speed(animation, now) {
      const { lastTimestamp, current } = animation;

      const deltaTime = Math.min(now - lastTimestamp, 64);
      animation.lastTimestamp = now;

      animation.current = current + (deltaTime / 1000) * config.speed;
    }

    function onStart(animation, value, now) {
      animation.current = value;
      animation.lastTimestamp = now;
      animation.initialVelocity = config.velocity;
    }

    return {
      onFrame: speed,
      onStart,
    };
  });
}
