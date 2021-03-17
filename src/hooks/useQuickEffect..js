import { useRef } from 'react';
export default function useQuickEffect(effect) {
  const wasCalled = useRef(false);
  if (!wasCalled.current) {
    wasCalled.current = true;
    effect();
  }
}
