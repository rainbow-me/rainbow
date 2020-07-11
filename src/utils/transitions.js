// TODO remove it when https://github.com/wcandillon/react-native-redash/pull/299
// will be merged
import { useEffect, useMemo } from 'react';
import { State } from 'react-native-gesture-handler';
import Animated, {
  Clock,
  Easing,
  spring,
  SpringUtils,
  timing,
  Value,
} from 'react-native-reanimated';

const { cond, eq, block, set, startClock, stopClock, neq } = Animated;

const defaultSpringConfig = SpringUtils.makeDefaultConfig();

export const withTransition = (
  value,
  timingConfig = {},
  gestureState = new Value(State.UNDETERMINED)
) => {
  const clock = new Clock();
  const state = {
    finished: new Value(0),
    frameTime: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };
  const config = {
    duration: 250,
    easing: Easing.linear,
    toValue: new Value(0),
    ...timingConfig,
  };
  return block([
    startClock(clock),
    cond(neq(config.toValue, value), [
      set(state.frameTime, 0),
      set(state.time, 0),
      set(state.finished, 0),
      set(config.toValue, value),
      startClock(clock),
    ]),
    cond(
      eq(gestureState, State.ACTIVE),
      [set(state.position, value)],
      timing(clock, state, config)
    ),
    cond(state.finished, stopClock(clock)),
    state.position,
  ]);
};

export const withSpringTransition = (
  value,
  springConfig = defaultSpringConfig,
  velocity = 0,
  gestureState = new Value(State.UNDETERMINED)
) => {
  const clock = new Clock();
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    velocity: new Value(0),
  };
  const config = {
    damping: 15,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 1,
    restSpeedThreshold: 1,
    stiffness: 150,
    toValue: new Value(0),
    ...springConfig,
  };
  return block([
    startClock(clock),
    cond(neq(config.toValue, value), [
      set(state.finished, 0),
      startClock(clock),
    ]),
    set(config.toValue, value),
    cond(
      eq(gestureState, State.ACTIVE),
      [set(state.velocity, velocity), set(state.position, value)],
      spring(clock, state, config)
    ),
    cond(state.finished, stopClock(clock)),
    state.position,
  ]);
};

export const withTimingTransition = withTransition;

export const useTransition = (state, config = {}) => {
  const value = useMemo(() => new Value(0), []);
  useEffect(() => {
    value.setValue(typeof state === 'boolean' ? (state ? 1 : 0) : state);
  }, [state, value]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transition = useMemo(() => withTransition(value, config), []);
  return transition;
};

export const useSpringTransition = (state, config = defaultSpringConfig) => {
  const value = useMemo(() => new Value(0), []);

  useEffect(() => {
    value.setValue(typeof state === 'boolean' ? (state ? 1 : 0) : state);
  }, [state, value]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transition = useMemo(() => withSpringTransition(value, config), []);
  return transition;
};

export const useTimingTransition = useTransition;
