import { useCallback, useEffect, useRef } from 'react';

export default function useInterval() {
  const handle = useRef<number>();

  const start = useCallback((func, ms) => {
    handle.current = setInterval(func, ms);
  }, []);

  const stop = useCallback(
    () => (handle.current ? clearInterval(handle.current) : undefined),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), []);

  return [start, stop, handle] as const;
}
