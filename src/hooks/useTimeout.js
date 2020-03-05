import { useCallback, useEffect, useRef } from 'react';

export default function useTimeout() {
  const ref = useRef();

  const clear = useCallback(() => ref.current && clearTimeout(ref.current), []);
  const create = useCallback((func, ms) => {
    ref.current = setTimeout(func, ms);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => clear(), []);

  return [clear, create, ref];
}
