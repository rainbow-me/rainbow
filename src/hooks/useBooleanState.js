import { useCallback, useState } from 'react';

export default function useBooleanState(initialStateBoolean = false) {
  const [bool, setBool] = useState(initialStateBoolean);

  const setTrue = useCallback(() => setBool(true), []);
  const setFalse = useCallback(() => setBool(false), []);

  return [bool, setTrue, setFalse];
}
