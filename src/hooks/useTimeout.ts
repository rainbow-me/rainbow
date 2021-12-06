import { useCallback, useEffect, useRef } from 'react';

export default function useTimeout() {
  const handle = useRef();

  const start = useCallback((func, ms) => {
    handle.current = setTimeout(func, ms);
  }, []);

  const stop = useCallback(
    () => handle.current && clearTimeout(handle.current),
    []
  );

  useEffect(() => () => stop(), [stop]);

  return [start, stop, handle];
}
