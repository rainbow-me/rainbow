import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import {
  resetSwapAmounts,
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import { ETH_ADDRESS } from '@rainbow-me/references';
import { greaterThan, subtract } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

const MIN_ETH = '0.01';

export default function useSwapInputs() {
  const dispatch = useDispatch();
  const assets = useSelector((state: AppState) => state.data.assets);
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );

  const resetAmounts = useCallback(() => {
    dispatch(resetSwapAmounts());
  }, [dispatch]);

  const updateMaxInputAmount = useCallback(() => {
    let amount =
      ethereumUtils.getAsset(assets, inputCurrencyAddress)?.balance?.amount ??
      0;
    if (inputCurrencyAddress === ETH_ADDRESS) {
      const remaining = subtract(amount, MIN_ETH);
      amount = greaterThan(remaining, 0) ? remaining : '0';
    }
    dispatch(updateSwapInputAmount(amount, true));
  }, [assets, dispatch, inputCurrencyAddress]);

  const updateInputAmount = useCallback(
    value => {
      dispatch(updateSwapInputAmount(value));
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
    updateMaxInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
