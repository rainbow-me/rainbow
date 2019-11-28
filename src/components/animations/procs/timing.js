import Animated, { Easing } from 'react-native-reanimated';
import { set } from './operators';
import { updateState } from './updateState';

const {
  block,
  Clock,
  clockRunning,
  cond,
  startClock,
  stopClock,
  Value,
} = Animated;

const timingProc = Animated.proc(
  (clock, finished, position, time, frameTime, toValue, duration) =>
    Animated.timing(
      clock,
      {
        finished,
        frameTime,
        position,
        time,
      },
      {
        duration,
        easing: Easing.linear,
        toValue,
      }
    )
);

const runTiming = (clock, state, config) =>
  timingProc(
    clock,
    state.finished,
    state.position,
    state.time,
    state.frameTime,
    config.toValue,
    config.duration
  );

export default function timing(params) {
  const { clock, duration, easing, from, to } = {
    clock: new Clock(),
    duration: 250,
    easing: Easing.linear,
    from: 0,
    to: 1,
    ...params,
  };

  const state = {
    finished: new Value(0),
    frameTime: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };

  const config = {
    duration,
    easing,
    toValue: new Value(0),
  };

  return block([
    cond(clockRunning(clock), 0, [
      updateState(
        from,
        to,
        state.finished,
        state.position,
        state.time,
        state.frameTime,
        config.toValue
      ),
      startClock(clock),
    ]),
    runTiming(clock, state, config),
    cond(state.finished, stopClock(clock)),
    set(from, state.position),
  ]);
}
