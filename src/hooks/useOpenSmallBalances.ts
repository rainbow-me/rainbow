import { useCallback } from 'react';
import { atom, useRecoilState } from 'recoil';

const areOpenSmallBalancesAtom = atom({
  default: false,
  key: 'areOpenSmallBalances',
});

export default function useOpenSmallBalances() {
  const [isSmallBalancesOpen, setIsSmallBalancesOpen] = useRecoilState(areOpenSmallBalancesAtom);

  const toggleOpenSmallBalances = useCallback(() => {
    setIsSmallBalancesOpen(prev => {
      return !prev;
    });
  }, [setIsSmallBalancesOpen]);

  return {
    isSmallBalancesOpen,
    setIsSmallBalancesOpen,
    toggleOpenSmallBalances,
  };
}
