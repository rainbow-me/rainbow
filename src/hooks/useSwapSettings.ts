import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapRoute as updateSwapRouteRedux,
  updateSwapSlippage as updateSwapSlippageRedux,
} from '@rainbow-me/redux/swap';

export default function useSwapSettings() {
  const dispatch = useDispatch();

  const slippage = useSelector((state: AppState) => state.swap.slippageInBips);
  const swapRoute = useSelector((state: AppState) => state.swap.route);

  const updateSwapSlippage = useCallback(
    value => {
      dispatch(updateSwapSlippageRedux(value));
    },
    [dispatch]
  );

  const updateSwapRoute = useCallback(
    value => {
      dispatch(updateSwapRouteRedux(value));
    },
    [dispatch]
  );
  return {
    slippageInBips: slippage,
    swapRoute,
    updateSwapRoute,
    updateSwapSlippage,
  };
}
