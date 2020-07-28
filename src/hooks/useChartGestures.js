import Animated from 'react-native-reanimated';
import {
  usePanGestureHandler,
  useTapGestureHandler,
  useValue,
} from 'react-native-redash';
import { useCallbackOne } from 'use-memo-one';
import {
  isGestureActiveProc,
  onEitherGestureActiveChange,
} from '../components/animations';
import useDimensions from './useDimensions';

const { and, call, cond, not, onChange, set, useCode } = Animated;

export default function useChartGestures(onGestureInactive) {
  const { width } = useDimensions();

  const isScrubbing = useValue(0); // 0 = false; 1 = true;
  const scrubberX = useValue(width);

  const {
    gestureHandler: panGestureHandler,
    position: panGesturePosition,
    state: panGestureState,
  } = usePanGestureHandler();

  const {
    gestureHandler: tapGestureHandler,
    position: tapGesturePosition,
    state: tapGestureState,
  } = useTapGestureHandler();

  useCode(
    useCallbackOne(
      () =>
        onEitherGestureActiveChange(
          panGestureState,
          tapGestureState,
          // 🧽️ Show scrubber if either gesture handler is active
          set(isScrubbing, 1),
          [
            // 🧽️ Hide the scrubber + reset the Chart Data Labels
            // if either of our gesture handlers become inactive 👌️🤠️
            set(isScrubbing, 0),
            call([], onGestureInactive),
          ]
        ),
      [isScrubbing, onGestureInactive]
    )
  );

  useCode(
    useCallbackOne(
      () =>
        // Set scrubberX to tap position if pan gesture isnt active yet
        onChange(
          isGestureActiveProc(tapGestureState),
          cond(
            and(
              isGestureActiveProc(tapGestureState),
              not(isGestureActiveProc(panGestureState))
            ),
            set(scrubberX, tapGesturePosition.x)
          )
        ),
      [panGestureState, scrubberX, tapGesturePosition, tapGestureState]
    )
  );

  useCode(
    useCallbackOne(
      () =>
        // Set scrubberX to pan position if pan gesture is active
        onChange(
          panGesturePosition.x,
          cond(
            isGestureActiveProc(panGestureState),
            set(scrubberX, panGesturePosition.x)
          )
        ),
      [panGesturePosition, panGestureState, scrubberX]
    )
  );

  return {
    isScrubbing,
    panGestureHandler,
    scrubberX,
    tapGestureHandler,
  };
}
