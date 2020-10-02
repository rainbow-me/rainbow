import { useCallback } from 'react';
import { setOpenSavings } from '../redux/openStateSettings';
import { useDispatch, useSelector } from '@rainbow-me/react-redux';

export default function useOpenSavings() {
  const dispatch = useDispatch();

  const isSavingsOpen = useSelector(
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
