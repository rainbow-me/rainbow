import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

/**
 * A minimal wrapper around `useEffect` that skips running
 * the provided `effect` callback on the first render, reacting
 * only to changes in dependencies.
 *
 * @param effect - The effect callback.
 * @param deps - Dependency list to compare.
 */
export function useOnChange(effect: EffectCallback, deps: DependencyList): void {
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
