import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import { ETH_ADDRESS } from '@rainbow-me/references';
import { greaterThan, subtract } from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

const MIN_ETH = '0.01';

export default function useSwapInputHandlers() {
  const dispatch = useDispatch();
  const type = useSelector((state: AppState) => state.swap.type);
  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );
  const assets = useSelector((state: AppState) => state.data.assets);
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );

  const updateMaxInputAmount = useCallback(() => {
    if (type === ExchangeModalTypes.withdrawal) {
      dispatch(updateSwapInputAmount(supplyBalanceUnderlying));
    } else {
      let amount =
        ethereumUtils.getAsset(assets, inputCurrencyAddress)?.balance?.amount ??
        0;
      if (inputCurrencyAddress === ETH_ADDRESS) {
        const remaining = subtract(amount, MIN_ETH);
        amount = greaterThan(remaining, 0) ? remaining : '0';
      }
      dispatch(updateSwapInputAmount(amount));
    }
  }, [assets, dispatch, inputCurrencyAddress, supplyBalanceUnderlying, type]);

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
    updateInputAmount,
    updateMaxInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
