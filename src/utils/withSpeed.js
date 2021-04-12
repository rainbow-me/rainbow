import { defineAnimation } from 'react-native-reanimated';

export default function withSpeed(userConfig) {
  'worklet';

  return defineAnimation(0, () => {
    'worklet';
    const config = {
      acceleration: 10,
      targetSpeed: 400,
    };
    if (userConfig) {
      Object.keys(userConfig).forEach(key => (config[key] = userConfig[key]));
    }

    function speed(animation, now) {
      const { lastTimestamp, current } = animation;

      const deltaTime = Math.min(now - lastTimestamp, 64);
      animation.lastTimestamp = now;
      if (config.targetSpeed > 0) {
        animation.speed = Math.min(
          config.targetSpeed,
          animation.speed + config.acceleration
        );
      } else {
        animation.speed = Math.max(
          config.targetSpeed,
          animation.speed - config.acceleration
        );
      }

      animation.current = current + (deltaTime / 1000) * animation.speed;
    }

    function onStart(animation, value, now) {
      animation.current = value;
      animation.lastTimestamp = now;
      animation.initialVelocity = config.velocity;
      animation.speed = 0;
    }

    return {
      onFrame: speed,
      onStart,
    };
  });
}
