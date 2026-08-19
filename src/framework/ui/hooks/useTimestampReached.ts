import { useEffect, useState } from 'react';

export function useTimestampReached(timestamp: number | null): boolean {
  const [hasReached, setHasReached] = useState(() => timestamp !== null && Date.now() >= timestamp);

  useEffect(() => {
    if (timestamp === null) {
      setHasReached(false);
      return;
    }

    const remaining = timestamp - Date.now();
    if (remaining <= 0) {
      setHasReached(true);
      return;
    }

    setHasReached(false);
    const timeoutId = setTimeout(() => setHasReached(true), remaining);
    return () => clearTimeout(timeoutId);
  }, [timestamp]);

  return hasReached;
}
