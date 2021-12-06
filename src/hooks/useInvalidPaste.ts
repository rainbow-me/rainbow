import { useCallback, useContext, useEffect } from 'react';
import useTimeout from './useTimeout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/RainbowCon... Remove this comment to see the full error message
import { RainbowContext } from '@rainbow-me/helpers/RainbowContext';

export default function useInvalidPaste() {
  const [startTimeout, stopTimeout] = useTimeout();
  const { isInvalidPaste = false, setGlobalState } = useContext(RainbowContext);

  const onInvalidPaste = useCallback(() => {
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
    stopTimeout();
    setGlobalState({ isInvalidPaste: true });
  }, [setGlobalState, stopTimeout]);

  // ⏰️ Reset isInvalidPaste value after 3 seconds.
  useEffect(() => {
    if (isInvalidPaste) {
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
      stopTimeout();
      // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
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
