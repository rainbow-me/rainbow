import { useCallback, useEffect, useRef } from 'react';

export default function useInterval() {
  const ref = useRef();

  const clear = useCallback(
    () => ref.current && clearInterval(ref.current),
    []
  );

  const create = useCallback((func, ms) => {
    ref.current = setInterval(func, ms);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clear(), []);

  return [clear, create, ref];
}
