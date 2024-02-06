import { defineAnimation } from 'react-native-reanimated';

export default function withSpeed(userConfig: any) {
  'worklet';

  return defineAnimation(0, () => {
    'worklet';
    const config = {
      acceleration: 10,
      targetSpeed: 400,
    };
    if (userConfig) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      Object.keys(userConfig).forEach(key => (config[key] = userConfig[key]));
    }

    function speed(animation: any, now: any) {
      const { lastTimestamp, current } = animation;

      const deltaTime = Math.min(now - lastTimestamp, 64);
      animation.lastTimestamp = now;
      if (config.targetSpeed > 0) {
        animation.speed = Math.min(config.targetSpeed, animation.speed + config.acceleration);
      } else {
        animation.speed = Math.max(config.targetSpeed, animation.speed - config.acceleration);
      }

      animation.current = current + (deltaTime / 1000) * animation.speed;
      return true;
    }

    function onStart(animation: any, value: any, now: any) {
      animation.current = value;
      animation.lastTimestamp = now;
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'velocity' does not exist on type '{ acce... Remove this comment to see the full error message
      animation.initialVelocity = config.velocity;
      animation.speed = 0;
    }

    return {
      onFrame: speed,
      onStart,
    };
  });
}
