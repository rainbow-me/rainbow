import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import { updateSwapSlippage as updateSwapSlippageRedux } from '@rainbow-me/redux/swap';

export default function useSwapSlippage() {
  const dispatch = useDispatch();

  const slippage = useSelector((state: AppState) => state.swap.slippageInBips);

  const updateSwapSlippage = useCallback(
    value => {
      dispatch(updateSwapSlippageRedux(value));
    },
    [dispatch]
  );

  return {
    slippageInBips: slippage,
    updateSwapSlippage,
  };
}
