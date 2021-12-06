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
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<Value>' is not assi... Remove this comment to see the full error message
      cond(
        isEitherGestureActiveProc(gestureStateOne, gestureStateTwo),
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
        onSuccess,
        onFailure
      )
    )
);
