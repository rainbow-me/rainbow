import { State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import contains from './contains';

const { cond, onChange, or, proc } = Animated;

const SUCCESS = [State.ACTIVE, State.BEGAN];

export const isGestureActiveProc = proc(gestureHandler =>
  contains(SUCCESS, gestureHandler)
);

export const isEitherGestureActiveProc = proc(
  (gestureStateOne, gestureStateTwo) =>
    or(
      isGestureActiveProc(gestureStateOne),
      isGestureActiveProc(gestureStateTwo)
    )
);

export const onEitherGestureActiveChange = proc(
  (gestureStateOne, gestureStateTwo, onSuccess, onFailure) =>
    onChange(
      isEitherGestureActiveProc(gestureStateOne, gestureStateTwo),
      cond(
        isEitherGestureActiveProc(gestureStateOne, gestureStateTwo),
        onSuccess,
        onFailure
      )
    )
);
