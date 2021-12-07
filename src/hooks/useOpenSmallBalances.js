import { useCallback, useEffect } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export default function useOpenSmallBalances() {
  const [isSmallBalancesOpen, setIsSmallBalancesOpen] = useMMKVBoolean(
    'small-balances-open'
  );

  const [stagger, setStagger] = useMMKVBoolean('small-balances-open-stagger');

  useEffect(() => {
    if (stagger) {
      setTimeout(() => setStagger(false), 700);
    }
  }, [setStagger, stagger]);

  const toggleOpenSmallBalances = useCallback(() => {
    if (!isSmallBalancesOpen) {
      setStagger(true);
    }
    setIsSmallBalancesOpen(prev => {
      return !prev;
    });
  }, [isSmallBalancesOpen, setIsSmallBalancesOpen, setStagger]);

  return {
    isSmallBalancesOpen,
    stagger,
    toggleOpenSmallBalances,
  };
}
