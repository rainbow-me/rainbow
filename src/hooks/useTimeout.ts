import { MutableRefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

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

export function useTimeoutEffect(onTimeout: (cancelled: boolean) => void, delay: number) {
  const callback = useRef(onTimeout);
  useLayoutEffect(() => {
    callback.current = onTimeout;
  }, [onTimeout]);

  const timeoutRef = useRef<NodeJS.Timeout>();
  useEffect(() => {
    const startedAt = Date.now();
    timeoutRef.current = setTimeout(() => callback.current(false), delay);
    const timeout = timeoutRef.current;
    return () => {
      clearTimeout(timeout);
      if (Date.now() - startedAt < delay) callback.current(true);
    };
  }, [delay]);
}
