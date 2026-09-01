import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useAnimatedTime } from './useAnimatedTime';

type Effect = () => void | (() => void);
type AnimationCallback = (finished?: boolean) => void;

type MockAnimationState = { active: boolean };

const mockEffects: Effect[] = [];
const mockTimingCallbacks: AnimationCallback[] = [];
let mockAnimationStates = new WeakMap<object, MockAnimationState>();

jest.mock('react', () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: Effect) => mockEffects.push(effect),
}));

jest.mock('react-native-reanimated', () => ({
  Easing: { linear: 'linear' },
  runOnUI: (worklet: () => void) => worklet,
  useSharedValue: (initialValue: unknown) => {
    let currentValue = initialValue;
    const animationState: MockAnimationState = { active: false };
    const sharedValue = {
      get value() {
        return currentValue;
      },
      set value(value: unknown) {
        currentValue = value;
        animationState.active = mockIsAnimation(value);
      },
    };

    mockEffects.push(() => () => {
      animationState.active = false;
    });
    mockAnimationStates.set(sharedValue, animationState);
    return sharedValue;
  },
  withRepeat: (animation: unknown) => ({ __animation: 'repeat', animation }),
  withSequence: (...animations: unknown[]) => ({ __animation: 'sequence', animations }),
  withTiming: (value: unknown, config: unknown, callback?: AnimationCallback) => {
    void config;
    if (callback) mockTimingCallbacks.push(callback);
    return { __animation: 'timing', value };
  },
}));

describe('useAnimatedTime lifecycle', () => {
  beforeEach(() => {
    mockAnimationStates = new WeakMap();
    mockEffects.length = 0;
    mockTimingCallbacks.length = 0;
  });

  it('preserves start, stop, restart, and completion behavior while mounted', () => {
    const onEndWorklet = jest.fn();
    const onStartWorklet = jest.fn();
    const timer = useAnimatedTime({ onEndWorklet, onStartWorklet });
    const cleanups = setupEffects();
    const timerClock = timer.timeInSeconds;

    timer.start();
    expect(getAnimationState(timerClock).active).toBe(true);
    expect(onStartWorklet).toHaveBeenCalledTimes(1);

    mockTimingCallbacks[0]?.(true);
    expect(onEndWorklet).toHaveBeenCalledTimes(1);

    timer.stop();
    expect(getAnimationState(timerClock).active).toBe(false);

    timer.restart();
    expect(getAnimationState(timerClock).active).toBe(true);
    expect(onStartWorklet).toHaveBeenCalledTimes(2);

    runCleanups(cleanups);
  });

  it('makes retained controls and completion callbacks inert after unmount', () => {
    const onEndWorklet = jest.fn();
    const onStartWorklet = jest.fn();
    const timer = useAnimatedTime({ onEndWorklet, onStartWorklet });
    const cleanups = setupEffects();
    const timerClock = timer.timeInSeconds;

    timer.start();
    const finish = mockTimingCallbacks[0];
    runCleanups(cleanups);

    expect(getAnimationState(timerClock).active).toBe(false);

    timer.start();
    timer.restart();
    finish?.(true);

    expect(getAnimationState(timerClock).active).toBe(false);
    expect(onStartWorklet).toHaveBeenCalledTimes(1);
    expect(onEndWorklet).not.toHaveBeenCalled();
  });

  it('restores a live auto-start timer during React Strict Mode effect replay', () => {
    const onStartWorklet = jest.fn();
    const timer = useAnimatedTime({ autoStart: true, onStartWorklet });
    const timerClock = timer.timeInSeconds;

    const firstCleanups = setupEffects();
    expect(getAnimationState(timerClock).active).toBe(true);

    runCleanups(firstCleanups);
    expect(getAnimationState(timerClock).active).toBe(false);

    const replayCleanups = setupEffects();
    expect(getAnimationState(timerClock).active).toBe(true);
    expect(onStartWorklet).toHaveBeenCalledTimes(2);

    runCleanups(replayCleanups);
    timer.restart();
    expect(getAnimationState(timerClock).active).toBe(false);
  });
});

function getAnimationState(sharedValue: object): MockAnimationState {
  const animationState = mockAnimationStates.get(sharedValue);
  if (!animationState) throw new Error('Expected a mocked shared value');
  return animationState;
}

function mockIsAnimation(value: unknown): boolean {
  return typeof value === 'object' && value !== null && '__animation' in value;
}

function setupEffects(): Array<() => void> {
  return mockEffects.map(effect => effect()).filter((cleanup): cleanup is () => void => typeof cleanup === 'function');
}

function runCleanups(cleanups: Array<() => void>): void {
  cleanups.forEach(cleanup => cleanup());
}
