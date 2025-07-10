import { idle, IdleOptions } from '@/helpers/idle';
import { useEffect, useState } from 'react';

export function useIsIdle(options?: IdleOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const { min, max, fully } = options || {};

  useEffect(() => {
    const controller = new AbortController();
    idle(controller.signal).then(() => {
      setIsIdle(true);
    });
    return () => {
      controller.abort();
    };
  }, [min, max, fully]);

  return isIdle;
}
