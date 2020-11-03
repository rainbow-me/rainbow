import { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash';
import { useNavigation } from './Navigation';
import { deviceUtils } from '@rainbow-me/utils';

const { width } = deviceUtils.dimensions;

let fallback;
let timeout;

function performAfterKeyboardAppear(action) {
  const listener = () => {
    action();
    Keyboard.removeListener('keyboardDidShow', listener);
  };
  Keyboard.addListener('keyboardDidShow', listener);
  // On simulator keyboard might not be visible
  fallback = listener;
  Keyboard.addListener('keyboardWillShow', () => {
    clearTimeout(timeout);
  });
}

export default function useOptionsForScrollPager() {
  const { setOptions } = useNavigation();
  const ref = useRef();
  const startPosition = useRef(-1);
  const [willBeOnSwapSelection, setWillBeOnSwapSelection] = useState(false);
  const tabTransitionPosition = useValue(0);
  const [swipeEnabled, setSwipeEnabled] = useState(false);

  const setPointerEvents = useCallback(pointerEventsVal => {
    ref.current.setNativeProps({
      pointerEvents: pointerEventsVal ? 'none' : 'auto',
    });
  }, []);

  const performImperativeAction = useCallback(
    action => {
      setPointerEvents(false);
      Keyboard.dismiss();
      action();
      performAfterKeyboardAppear(() => setPointerEvents(true));
    },
    [setPointerEvents]
  );
  const setKeyboardShouldFocus = useCallback(() => {
    // sometimes it happens on simulator that keyboard is disabled
    timeout = setTimeout(fallback, 400);
  }, []);

  const contextValue = useMemo(
    () => ({
      performImperativeAction,
      setKeyboardShouldFocus,
      startedTransition: willBeOnSwapSelection,
    }),
    [performImperativeAction, willBeOnSwapSelection, setKeyboardShouldFocus]
  );

  const onMomentumScrollEnd = useCallback(
    position => {
      // if navigated to the second screen
      if (position === width) {
        setSwipeEnabled(true);
        // if started from second screen, hence keyboard is visible
        if (startPosition.current === width) {
          setPointerEvents(true);
        }
      }
      // if navigated to the first screen
      if (position === 0) {
        setSwipeEnabled(false);
        setPointerEvents(true);
      }
      // reset start position
      startPosition.current = -1;
    },
    [setPointerEvents, setSwipeEnabled]
  );

  const onSwipeEnd = useCallback(
    (position, targetContentOffset) => {
      if (position !== width && position !== 0) {
        setPointerEvents(false);
      }

      if (position === 0) {
        setSwipeEnabled(false);
        setPointerEvents(true);
      }
      if (position === targetContentOffset) {
        startPosition.current = -1;
        if (startPosition.current === width) {
          setPointerEvents(true);
        }
      }

      if (targetContentOffset === 0) {
        // allow inputs to be accessible and focusable
        setWillBeOnSwapSelection(true);
      }
    },
    [setSwipeEnabled, setPointerEvents]
  );

  const onSwipeStart = useCallback(
    position => {
      // set start position on the beginning of the gesture
      startPosition.current = position;
      if (position === width) {
        // block immediately further interactions
        setPointerEvents(false);
      }
    },
    [setPointerEvents]
  );

  const toggleGestureEnabled = useCallback(
    dismissable => {
      setOptions({ dismissable });
    },
    [setOptions]
  );
  return {
    contextValue,
    onMomentumScrollEnd,
    onSwipeEnd,
    onSwipeStart,
    ref,
    setPointerEvents,
    swipeEnabled,
    tabTransitionPosition,
    toggleGestureEnabled,
  };
}
