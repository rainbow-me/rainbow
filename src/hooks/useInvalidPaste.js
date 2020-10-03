import { useCallback, useEffect } from 'react';
import useTimeout from './useTimeout';

let isInvalidPaste = false;

export default function useInvalidPaste() {
  const [startTimeout] = useTimeout();

  const triggerInvalidPaste = useCallback(() => {
    isInvalidPaste = true;
  }, []);

  // ⏰️ Reset isInvalidPaste value after 3 seconds.
  useEffect(() => {
    if (isInvalidPaste) {
      startTimeout(() => {
        isInvalidPaste = false;
      }, 3000);
    }
  }, [startTimeout]);

  return {
    isInvalidPaste,
    triggerInvalidPaste,
  };
}
