import { useCallback, useState } from 'react';

/**
 * Force update the functional component just like `forceUpdate`
 * on class components.
 * @returns `() => void` forceUpdate
 */
export const useForceUpdate = () => {
  const [, setState] = useState(false);
  const forceUpdate = useCallback(() => {
    setState(state => !state);
  }, []);
  return forceUpdate;
};
