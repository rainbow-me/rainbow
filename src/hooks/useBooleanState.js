import { useCallback, useState } from 'react';

export default function useBooleanState(initialBooleanState = false) {
  const [bool, setBool] = useState(initialBooleanState);
  const setTrue = useCallback(() => setBool(true), []);
  const setFalse = useCallback(() => setBool(false), []);
  return [bool, setTrue, setFalse];
}
