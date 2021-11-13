import { useCallback, useContext, useEffect } from 'react';
import useTimeout from './useTimeout';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';

export default function useInvalidPaste() {
  const [startTimeout, stopTimeout] = useTimeout();
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
  useEffect(() => () => setGlobalState({ isInvalidPaste: false }), [
    setGlobalState,
  ]);

  return {
    isInvalidPaste,
    onInvalidPaste,
  };
}
