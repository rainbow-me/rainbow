import { useCallback, useContext, useEffect } from 'react';
import useTimeout from './useTimeout';
import { RainbowContext } from '@/helpers/RainbowContext';

export default function useInvalidPaste() {
  const [startTimeout, stopTimeout] = useTimeout();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isInvalidPaste' does not exist on type '... Remove this comment to see the full error message
  const { isInvalidPaste = false, setGlobalState } = useContext(RainbowContext);

  const onInvalidPaste = useCallback(() => {
    stopTimeout();
    setGlobalState({ isInvalidPaste: true });
  }, [setGlobalState, stopTimeout]);

  // ⏰️ Reset isInvalidPaste value after 3 seconds.
  useEffect(() => {
    if (isInvalidPaste) {
      stopTimeout();
      startTimeout(() => setGlobalState({ isInvalidPaste: false }), 3000);
    }
  }, [isInvalidPaste, setGlobalState, startTimeout, stopTimeout]);

  // 🚪️ Reset isInvalidPaste when we leave the screen
  useEffect(() => () => setGlobalState({ isInvalidPaste: false }), [setGlobalState]);

  return {
    isInvalidPaste,
    onInvalidPaste,
  };
}
