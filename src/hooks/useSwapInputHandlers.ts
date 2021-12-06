import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { ExchangeModalTypes } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/store' or it... Remove this comment to see the full error message
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
} from '@rainbow-me/redux/swap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { greaterThan, subtract } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
