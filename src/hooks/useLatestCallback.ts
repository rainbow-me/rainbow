import React from 'react';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/**
 * React hook which returns the latest callback without changing the reference.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export default function useLatestCallback<T extends Function>(callback: T): T {
  const ref = React.useRef<T>(callback);

  const latestCallback = React.useRef(function latestCallback(this: unknown, ...args: unknown[]) {
    return ref.current.apply(this, args);
  } as unknown as T).current;

  useIsomorphicLayoutEffect(() => {
    ref.current = callback;
  });

  return latestCallback;
}
// eslint-enable @typescript-eslint/ban-types
