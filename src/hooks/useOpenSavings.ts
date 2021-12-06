import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenSavings } from '../redux/openStateSettings';

export default function useOpenSavings() {
  const dispatch = useDispatch();

  const isSavingsOpen = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openStateSettings' does not exist on typ... Remove this comment to see the full error message
    ({ openStateSettings: { openSavings } }) => openSavings
  );

  const toggleOpenSavings = useCallback(
    () => dispatch(setOpenSavings(!isSavingsOpen)),
    [dispatch, isSavingsOpen]
  );

  return {
    isSavingsOpen,
    toggleOpenSavings,
  };
}
