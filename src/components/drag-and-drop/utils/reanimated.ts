import { LayoutRectangle } from 'react-native';
import { SharedValue, withSpring, type AnimatableValue, type AnimationCallback, type WithSpringConfig } from 'react-native-reanimated';
import type { SharedPoint } from '../hooks';
import type { AnyData } from '../types';

export const DND_DEFAULT_SPRING_CONFIG: WithSpringConfig = {
  damping: 10, // Defines how the spring’s motion should be damped due to the forces of friction. Default 10.
  mass: 1, // The mass of the object attached to the end of the spring. Default 1.
  stiffness: 100, // The spring stiffness coefficient. Default 100.
  overshootClamping: false, // Indicates whether the spring should be clamped and not bounce. Default false.
  restSpeedThreshold: 0.001, // The speed at which the spring should be considered at rest in pixels per second. Default 0.001.
  restDisplacementThreshold: 0.2, // The threshold of displacement from rest below which the spring should be considered at rest. Default 0.001.
};
export const DND_FAST_SPRING_CONFIG: WithSpringConfig = {
  damping: 20, // Defines how the spring’s motion should be damped due to the forces of friction. Default 10.
  mass: 0.5, // The mass of the object attached to the end of the spring. Default 1.
  stiffness: 100, // The spring stiffness coefficient. Default 100.
  overshootClamping: false, // Indicates whether the spring should be clamped and not bounce. Default false.
  restSpeedThreshold: 0.2, // The speed at which the spring should be considered at rest in pixels per second. Default 0.001.
  restDisplacementThreshold: 0.2, // The threshold of displacement from rest below which the spring should be considered at rest. Default 0.001.
};
export const DND_DEFAULT_SPRING_CONFIG_3: WithSpringConfig = {
  damping: 20, // Defines how the spring’s motion should be damped due to the forces of friction. Default 10.
  mass: 0.5, // The mass of the object attached to the end of the spring. Default 1.
  stiffness: 100, // The spring stiffness coefficient. Default 100.
  overshootClamping: false, // Indicates whether the spring should be clamped and not bounce. Default false.
  restSpeedThreshold: 0.01, // The speed at which the spring should be considered at rest in pixels per second. Default 0.001.
  restDisplacementThreshold: 0.2, // The threshold of displacement from rest below which the spring should be considered at rest. Default 0.001.
};
export const DND_SLOW_SPRING_CONFIG: WithSpringConfig = {
  damping: 20, // Defines how the spring’s motion should be damped due to the forces of friction. Default 10.
  mass: 1, // The mass of the object attached to the end of the spring. Default 1.
  stiffness: 10, // The spring stiffness coefficient. Default 100.
  overshootClamping: false, // Indicates whether the spring should be clamped and not bounce. Default false.
  restSpeedThreshold: 0.01, // The speed at which the spring should be considered at rest in pixels per second. Default 0.001.
  restDisplacementThreshold: 0.2, // The threshold of displacement from rest below which the spring should be considered at rest. Default 0.001.
};

/**
 * @summary Waits for n-callbacks
 * @worklet
 */
export const waitForAll = <T extends unknown[]>(callback: (...args: T) => void, count = 2) => {
  'worklet';
  const status = new Array(count).fill(false);
  const result = new Array(count).fill(undefined);
  return status.map((_v, index) => {
    return (...args: unknown[]) => {
      status[index] = true;
      result[index] = args;
      if (status.every(Boolean)) {
        callback(...(result as T));
      }
    };
  });
};

type AnimationCallbackParams = Parameters<AnimationCallback>;

export type AnimationPointCallback = (
  finished: [boolean | undefined, boolean | undefined],
  current: [AnimatableValue | undefined, AnimatableValue | undefined]
) => void;

// eslint-disable-next-line default-param-last
export const withDefaultSpring: typeof withSpring = (toValue, userConfig: WithSpringConfig = {}, callback) => {
  'worklet';
  // eslint-disable-next-line prefer-object-spread
  const config: WithSpringConfig = Object.assign({}, DND_SLOW_SPRING_CONFIG, userConfig);
  return withSpring(toValue, config, callback);
};

/**
 * @summary Easily animate a `SharePoint`
 * @worklet
 */
export const animatePointWithSpring = (
  point: SharedPoint,
  [toValueX, toValueY]: [number, number],
  // eslint-disable-next-line default-param-last
  [configX, configY]: [WithSpringConfig | undefined, WithSpringConfig | undefined] = [undefined, undefined],
  callback?: AnimationPointCallback
) => {
  'worklet';
  const [waitForX, waitForY] = waitForAll<[AnimationCallbackParams, AnimationCallbackParams]>(
    ([finishedX, currentX], [finishedY, currentY]) => {
      if (!callback) {
        return;
      }
      callback([finishedX, finishedY], [currentX, currentY]);
    }
  );
  point.x.value = withSpring(toValueX, configX, waitForX);
  point.y.value = withSpring(toValueY, configY, waitForY);
};

export const moveArrayIndex = <T>(input: T[], from: number, to: number) => {
  'worklet';
  const output = input.slice();
  output.splice(to, 0, output.splice(from, 1)[0]);
  return output;
};

export const stringifySharedPoint = ({ x, y }: SharedPoint) => {
  'worklet';
  return `{"x": ${Math.floor(x.value)}, "y": ${Math.floor(y.value)}}`;
};

export const stringifyLayout = ({ x, y, width, height }: LayoutRectangle) => {
  'worklet';
  return `{"x": ${Math.floor(x)}, "y": ${Math.floor(y)}, "width": ${Math.floor(width)}, "height": ${Math.floor(height)}}`;
};

export const floorLayout = ({ x, y, width, height }: LayoutRectangle) => {
  'worklet';
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    width: Math.floor(width),
    height: Math.floor(height),
  };
};

/**
 * @summary Checks if a value is a `Reanimated` shared value
 * @param {object} value - The value to check
 * @returns {boolean} Whether the value is a `Reanimated` shared value
 */
export const isReanimatedSharedValue = (value: unknown): value is SharedValue<AnyData> =>
  typeof value === 'object' && (value as { _isReanimatedSharedValue: boolean })?._isReanimatedSharedValue;
