import { useCallback, useContext, useEffect } from 'react';
import useTimeout from './useTimeout';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';

export default function useInvalidPaste() {
  const [startTimeout] = useTimeout();
  const { isInvalidPaste = false, setGlobalState } = useContext(RainbowContext);

  const triggerInvalidPaste = useCallback(
    () => setGlobalState({ isInvalidPaste: true }),
    [setGlobalState]
  );

  // ⏰️ Reset isInvalidPaste value after 3 seconds.
  useEffect(() => {
    if (isInvalidPaste) {
      startTimeout(() => setGlobalState({ isInvalidPaste: false }), 3000);
    }
  }, [isInvalidPaste, setGlobalState, startTimeout]);

  return {
    isInvalidPaste,
    triggerInvalidPaste,
  };
}
