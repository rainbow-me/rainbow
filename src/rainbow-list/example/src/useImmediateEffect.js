import { useEffect, useRef } from 'react';

function depsDiff(deps1, deps2) {
  return !((Array.isArray(deps1) && Array.isArray(deps2)) &&
    deps1.length === deps2.length &&
    deps1.every((dep, idx) => Object.is(dep, deps2[idx]))
  );
}

export function useImmediateEffect(effect, deps) {
  const cleanupRef = useRef();
  const depsRef = useRef();

  if (!depsRef.current || depsDiff(depsRef.current, deps)) {
    depsRef.current = deps;

    if (cleanupRef.current) {
      cleanupRef.current();
    }

    cleanupRef.current = effect();
  }

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);
};
