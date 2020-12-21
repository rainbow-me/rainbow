import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOpenSavings } from '../redux/openStateSettings';

export default function useOpenSavings() {
  const dispatch = useDispatch();

  const isSavingsOpen = useSelector(({ openSavings }) => openSavings);

  const toggleOpenSavings = useCallback(
    () => dispatch(setOpenSavings(!isSavingsOpen)),
    [dispatch, isSavingsOpen]
  );

  return {
    isSavingsOpen,
    toggleOpenSavings,
  };
}
