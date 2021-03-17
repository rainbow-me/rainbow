import { useEffect, useRef } from 'react';
export default function useQuickEffect(effect, deps) {
  const wasCalled = useRef(false);
  const isInitial = useRef(true);
  if (!wasCalled.current) {
    wasCalled.current = true;
    effect();
  }
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
    } else {
      return effect();
    }
  }, deps);
}
