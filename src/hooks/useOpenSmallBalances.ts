import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenSmallBalances } from '../redux/openStateSettings';

export default function useOpenSmallBalances() {
  const dispatch = useDispatch();

  const isSmallBalancesOpen = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openStateSettings' does not exist on typ... Remove this comment to see the full error message
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
