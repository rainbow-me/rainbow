import { useCallback } from 'react';
import { useMMKVBoolean } from 'react-native-mmkv';

export default function useOpenSmallBalances() {
  const [isSmallBalancesOpen, setIsSmallBalancesOpen] = useMMKVBoolean(
    'small-balances-open'
  );

  const toggleOpenSmallBalances = useCallback(
    () => setIsSmallBalancesOpen(prev => !prev),
    [setIsSmallBalancesOpen]
  );

  return {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  };
}
