import { useCallback } from 'react';
import { setOpenSmallBalances } from '../redux/openStateSettings';
import { useDispatch, useSelector } from '@rainbow-me/react-redux';

export default function useOpenSmallBalances() {
  const dispatch = useDispatch();

  const isSmallBalancesOpen = useSelector(
    ({ openStateSettings: { openSmallBalances } }) => openSmallBalances
  );

  const toggleOpenSmallBalances = useCallback(
    () => dispatch(setOpenSmallBalances(!isSmallBalancesOpen)),
    [dispatch, isSmallBalancesOpen]
  );

  return {
    isSmallBalancesOpen,
    toggleOpenSmallBalances,
  };
}
