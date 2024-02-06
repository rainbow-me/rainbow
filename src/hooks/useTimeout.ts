import { MutableRefObject, useCallback, useEffect, useRef } from 'react';

export default function useTimeout(): [(func: () => void, ms?: number) => void, () => void, MutableRefObject<NodeJS.Timeout | null>] {
  const handle = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback((func: () => void, ms?: number) => {
    handle.current = setTimeout(func, ms);
  }, []);

  const stop = useCallback(() => {
    if (handle.current) {
      clearTimeout(handle.current);
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return [start, stop, handle];
}
