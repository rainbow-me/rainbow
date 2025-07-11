import { useRef } from 'react';

export function useIsFirstRender() {
  const isFirstRender = useRef(true);

  if (isFirstRender.current) {
    isFirstRender.current = false;
    return true;
  }

  return false;
}
