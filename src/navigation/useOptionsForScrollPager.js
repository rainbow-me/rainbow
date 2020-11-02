import { useCallback, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useValue } from 'react-native-redash';
import { useNavigation } from './Navigation';
import { deviceUtils } from '@rainbow-me/utils';

const { width } = deviceUtils.dimensions;

export default function useOptionsForScrollPager() {
  const { setOptions } = useNavigation();
  const pointerEvents = useRef('auto');
  const ref = useRef();
  const startPosition = useRef(-1);
  const [willBeOnSwapSelection, setWillBeOnSwapSelection] = useState(false);
  const tabTransitionPosition = useValue(0);
  const [swipeEnabled, setSwipeEnabled] = useState(false);

  const setPointerEvents = useCallback(pointerEventsVal => {
    pointerEvents.current = pointerEventsVal;
    ref.current.setNativeProps({
      pointerEvents: pointerEventsVal ? 'none' : 'auto',
    });
  }, []);

  const performImperativeAction = useCallback(
    action => {
      setPointerEvents(false);
      Keyboard.dismiss();
      action();
      const listener = () => {
        setPointerEvents(true);
        Keyboard.removeListener('keyboardDidShow', listener);
      };
      Keyboard.addListener('keyboardDidShow', listener);
    },
    [setPointerEvents]
  );

  const contextValue = useMemo(
    () => ({
      performImperativeAction,
      startedTransition: willBeOnSwapSelection,
    }),
    [performImperativeAction, willBeOnSwapSelection]
  );

  const onMomentumScrollEnd = useCallback(
    position => {
      if (position === width) {
        if (startPosition.current === width) {
          setPointerEvents(true);
        }
        setSwipeEnabled(true);
      } else if (position === 0) {
        setSwipeEnabled(false);
        setPointerEvents(true);
      }
      startPosition.current = -1;
    },
    [setPointerEvents, setSwipeEnabled]
  );

  const onSwipeEnd = useCallback(
    (position, targetContentOffset) => {
      if (position !== width && position !== 0) {
        setPointerEvents(false);
      }

      if (position === width && startPosition.current === width) {
        setPointerEvents(true);
      }

      if (position === 0) {
        setSwipeEnabled(false);
        setPointerEvents(true);
      }
      if (position === targetContentOffset) {
        startPosition.current = -1;
      }

      if (targetContentOffset === 0) {
        setWillBeOnSwapSelection(true);
      }
    },
    [setSwipeEnabled, setPointerEvents]
  );

  const onSwipeStart = useCallback(
    position => {
      startPosition.current = position;
      if (position === width) {
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
