import { useEffect, useState } from 'react';

export const useDelayedMount = ({ delay = 0, skipDelayedMount = false } = {}) => {
  const [shouldMount, setShouldMount] = useState(skipDelayedMount);

  useEffect(() => {
    if (!skipDelayedMount) {
      if (delay === 0) {
        setShouldMount(true);
      } else {
        const timeout = setTimeout(() => setShouldMount(true), delay);
        return () => clearTimeout(timeout);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return shouldMount;
};
