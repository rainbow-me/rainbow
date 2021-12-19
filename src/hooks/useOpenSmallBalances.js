import { useCallback, useEffect } from 'react';
import { atom, useRecoilState } from 'recoil';

const areOpenSmallBalancesAtom = atom({
  default: false,
  key: 'areOpenSmallBalances',
});

const areOpenSmallBalancesStaggerAtom = atom({
  default: false,
  key: 'areOpenSmallBalancesStagger',
});

export default function useOpenSmallBalances() {
  const [isSmallBalancesOpen, setIsSmallBalancesOpen] = useRecoilState(
    areOpenSmallBalancesAtom
  );

  const [stagger, setStagger] = useRecoilState(areOpenSmallBalancesStaggerAtom);

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
    setIsSmallBalancesOpen,
    stagger,
    toggleOpenSmallBalances,
  };
}
