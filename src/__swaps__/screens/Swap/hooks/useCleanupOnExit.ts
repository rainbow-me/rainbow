import { useEffect } from 'react';
import { useSwapContext } from '../providers/swap-provider';

export const useCleanupOnExit = () => {
  const { reset } = useSwapContext();

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
