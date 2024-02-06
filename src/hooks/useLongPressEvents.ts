import { useCallback, useRef } from 'react';
import useTimeout from './useTimeout';

export default function useLongPressEvents({ minLongPressDuration = 500, onLongPress, onPress }: any) {
  const isPressEventLegal = useRef(false);
  const [startTimeout, stopTimeout, timeoutRef] = useTimeout();

  const handleStartPress = useCallback(() => {
    if (timeoutRef.current == null) {
      startTimeout(() => {
        timeoutRef.current = null;
        onLongPress?.();
      }, minLongPressDuration);
    }

    isPressEventLegal.current = true;
  }, [minLongPressDuration, onLongPress, startTimeout, timeoutRef]);

  const handlePress = useCallback(() => {
    stopTimeout();
    if (timeoutRef.current) {
      onPress?.();
      timeoutRef.current = null;
    }
  }, [onPress, stopTimeout, timeoutRef]);

  const handleCancel = useCallback(() => {
    stopTimeout();
    isPressEventLegal.current = false;
  }, [stopTimeout]);

  return {
    handleCancel,
    handlePress,
    handleStartPress,
  };
}
