import { useCallback, useRef } from 'react';
import useTimeout from './useTimeout';

export default function useLongPressEvents({
  minLongPressDuration = 500,
  onLongPress,
  onPress,
}: any) {
  const isPressEventLegal = useRef(false);
  const [startTimeout, stopTimeout, timeoutRef] = useTimeout();

  const handleStartPress = useCallback(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'current' does not exist on type '((func:... Remove this comment to see the full error message
    if (timeoutRef.current == null) {
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      startTimeout(() => {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'current' does not exist on type '((func:... Remove this comment to see the full error message
        timeoutRef.current = null;
        onLongPress?.();
      }, minLongPressDuration);
    }

    isPressEventLegal.current = true;
  }, [minLongPressDuration, onLongPress, startTimeout, timeoutRef]);

  const handlePress = useCallback(() => {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    stopTimeout();
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'current' does not exist on type '((func:... Remove this comment to see the full error message
    if (timeoutRef.current) {
      onPress?.();
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'current' does not exist on type '((func:... Remove this comment to see the full error message
      timeoutRef.current = null;
    }
  }, [onPress, stopTimeout, timeoutRef]);

  const handleCancel = useCallback(() => {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    stopTimeout();
    isPressEventLegal.current = false;
  }, [stopTimeout]);

  return {
    handleCancel,
    handlePress,
    handleStartPress,
  };
}
