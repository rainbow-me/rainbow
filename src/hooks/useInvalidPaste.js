import { useCallback, useContext, useEffect } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import useTimeout from './useTimeout';
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';

export default function useInvalidPaste() {
  const [startTimeout, stopTimeout] = useTimeout();
  const { isInvalidPaste = false, setGlobalState } = useContext(RainbowContext);

  const onInvalidPaste = useCallback(() => {
    stopTimeout();
    setGlobalState({ isInvalidPaste: true });
  }, [setGlobalState, stopTimeout]);

  const reset = useCallback(() => setGlobalState({ isInvalidPaste: false }), [
    setGlobalState,
  ]);

  // ⏰️ Reset isInvalidPaste value after 3 seconds.
  !IS_TESTING &&
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (isInvalidPaste) {
        stopTimeout();
        reset && startTimeout(reset, 3000);
      }
    }, [isInvalidPaste, reset, startTimeout, stopTimeout]);

  // 🚪️ Reset isInvalidPaste when we leave the screen
  !IS_TESTING &&
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => () => setGlobalState({ isInvalidPaste: false }), [
      setGlobalState,
    ]);

  return {
    isInvalidPaste,
    onInvalidPaste,
  };
}
