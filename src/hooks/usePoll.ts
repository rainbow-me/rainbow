import { useEffect, useLayoutEffect, useRef } from 'react';

export function usePoll(callback: () => void, delay: number) {
  const cbRef = useRef<() => void>();

  useLayoutEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const cb = () => cbRef.current?.();
    const id = setInterval(cb, delay);
    return () => {
      clearInterval(id);
    };
  }, [callback, delay]);
}
