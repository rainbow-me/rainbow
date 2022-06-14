import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapSlippage as updateSwapSlippageRedux,
  updateSwapSource as updateSwapSourceRedux,
} from '@rainbow-me/redux/swap';

export default function useSwapSettings() {
  const dispatch = useDispatch();

  const slippage = useSelector((state: AppState) => state.swap.slippageInBips);
  const currentSource = useSelector((state: AppState) => state.swap.source);

  const updateSwapSlippage = useCallback(
    value => {
      dispatch(updateSwapSlippageRedux(value));
    },
    [dispatch]
  );

  const updateSwapSource = useCallback(
    value => {
      dispatch(updateSwapSourceRedux(value));
    },
    [dispatch]
  );
  return {
    slippageInBips: slippage,
    source: currentSource,
    updateSwapSlippage,
    updateSwapSource,
  };
}
