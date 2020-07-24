import { State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import contains from './contains';

const { cond, onChange, or, proc } = Animated;

const SUCCESS = [State.ACTIVE, State.BEGAN];
export const isEitherGestureActiveProc = proc(
  (gestureStateOne, gestureStateTwo) =>
    or(contains(SUCCESS, gestureStateOne), contains(SUCCESS, gestureStateTwo))
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
