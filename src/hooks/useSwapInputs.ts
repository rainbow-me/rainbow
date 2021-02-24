import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  resetSwapAmounts,
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';

export default function useSwapInputs() {
  const dispatch = useDispatch();

  const resetAmounts = useCallback(() => {
    dispatch(resetSwapAmounts());
  }, [dispatch]);

  const updateInputAmount = useCallback(
    (value, isMax = false) => {
      dispatch(updateSwapInputAmount(value, isMax));
    },
    [dispatch]
  );

  const updateNativeAmount = useCallback(
    value => {
      dispatch(updateSwapNativeAmount(value));
    },
    [dispatch]
  );

  const updateOutputAmount = useCallback(
    value => {
      dispatch(updateSwapOutputAmount(value));
    },
    [dispatch]
  );

  return {
    resetAmounts,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
