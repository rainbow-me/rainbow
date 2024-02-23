import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

export default function useInterval(): [(func: () => void, ms?: number) => void, () => void, MutableRefObject<NodeJS.Timeout | null>] {
  const handle = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((func: () => void, ms?: number) => {
    handle.current = setInterval(func, ms);
  }, []);

  const stop = useCallback(() => {
    if (handle.current) {
      clearInterval(handle.current);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), []);

  return [start, stop, handle];
}
