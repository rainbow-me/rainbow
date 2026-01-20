import { MutableRefObject, useCallback, useEffect, useLayoutEffect, useRef } from 'react';

export default function useTimeout(): [
  (func: () => void, ms?: number) => void,
  () => void,
  MutableRefObject<ReturnType<typeof setTimeout> | null>,
] {
  const handle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback((func: () => void, ms?: number) => {
    if (handle.current) {
      clearTimeout(handle.current);
    }
    handle.current = setTimeout(func, ms);
  }, []);

  const stop = useCallback(() => {
    if (handle.current) {
      clearTimeout(handle.current);
      handle.current = null;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return [start, stop, handle];
}

export function useTimeoutEffect(
  onTimeout: (e: { cancelled: boolean; elapsedTime: number }) => void,
  { timeout, enabled = true }: { timeout: number; enabled?: boolean }
) {
  const callback = useRef(onTimeout);
  useLayoutEffect(() => {
    callback.current = onTimeout;
  }, [onTimeout]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const startedAt = Date.now();
    timeoutRef.current = setTimeout(() => {
      callback.current({
        cancelled: false,
        elapsedTime: Date.now() - startedAt,
      });
    }, timeout);
    return () => {
      if (!timeoutRef.current) return;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      const elapsedTime = Date.now() - startedAt;
      if (elapsedTime < timeout) {
        callback.current({ cancelled: true, elapsedTime });
      }
    };
  }, [timeout, enabled]);
}
