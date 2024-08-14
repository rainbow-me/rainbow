import { useCallback, useLayoutEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

/**
 * Hook to define an event handler with a function identity that is always stable
 * {@link https://blog.logrocket.com/what-you-need-know-react-useevent-hook-rfc/}
 */
export const useEvent = <T extends EventHandler>(handler: T | undefined) => {
  const handlerRef = useRef<T | undefined>(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args: unknown[]) => {
    return handlerRef.current?.(...args);
  }, []);
};
