import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { Source } from '@/raps/references';
import { updateSwapSlippage as updateSwapSlippageRedux, updateSwapSource as updateSwapSourceRedux } from '@/redux/swap';

export default function useSwapSettings() {
  const dispatch = useDispatch();

  const slippage = useSelector((state: AppState) => state.swap.slippageInBips);
  const maxInputUpdate = useSelector((state: AppState) => state.swap.maxInputUpdate);
  const flipCurrenciesUpdate = useSelector((state: AppState) => state.swap.flipCurrenciesUpdate);
  const currentSource = useSelector((state: AppState) => state.swap.source);

  const updateSwapSlippage = useCallback(
    (value: number) => {
      dispatch(updateSwapSlippageRedux(value));
    },
    [dispatch]
  );

  const updateSwapSource = useCallback(
    (value: Source) => {
      dispatch(updateSwapSourceRedux(value));
    },
    [dispatch]
  );
  return {
    flipCurrenciesUpdate,
    maxInputUpdate,
    slippageInBips: slippage,
    source: currentSource,
    updateSwapSlippage,
    updateSwapSource,
  };
}
