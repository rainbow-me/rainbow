import { useSmallBalancesStore } from '@/state/smallBalances/smallBalances';

export default function useOpenSmallBalances() {
  const isSmallBalancesOpen = useSmallBalancesStore(state => state.areOpenSmallBalances);
  const toggleOpenSmallBalances = useSmallBalancesStore(state => state.toggleOpenSmallBalances);

  // For backward compatibility
  const setIsSmallBalancesOpen = (value: boolean) => {
    if (value !== isSmallBalancesOpen) {
      toggleOpenSmallBalances();
    }
  };

  return {
    isSmallBalancesOpen,
    setIsSmallBalancesOpen,
    toggleOpenSmallBalances,
  };
}
