import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenSmallBalances } from '../redux/openStateSettings';

export default function useOpenSmallBalances() {
  const dispatch = useDispatch();

  const isSmallBalancesOpen = useSelector(
    ({ openSmallBalances }) => openSmallBalances
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
