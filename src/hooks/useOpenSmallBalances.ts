import { useSmallBalancesStore, toggleOpenSmallBalances } from '@/state/smallBalances/smallBalances';

export default function useOpenSmallBalances() {
  const isSmallBalancesOpen = useSmallBalancesStore(state => state.areOpenSmallBalances);

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
