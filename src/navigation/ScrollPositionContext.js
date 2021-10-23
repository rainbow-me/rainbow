import { createContext, useContext } from 'react';

export const ScrollPositionContext = createContext(null);
export function usePagerPosition() {
  return useContext(ScrollPositionContext);
}
