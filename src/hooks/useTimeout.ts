import { Ref, useCallback, useEffect, useRef } from 'react';

export default function useTimeout(): [
  ReturnType<typeof useCallback>,
  ReturnType<typeof useCallback>,
  Ref<number | undefined>
] {
  const handle = useRef<number | undefined>();

  const start = useCallback((func, ms) => {
    handle.current = setTimeout(func, ms);
  }, []);

  const stop = useCallback(
    () => (handle.current && clearTimeout(handle.current)) as void,
    []
  );

  useEffect(() => () => stop(), [stop]);

  return [start, stop, handle];
}
