import lang from 'i18n-js';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from '../components/alerts';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  greaterThan,
  multiply,
  subtract,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import { useGas } from '@rainbow-me/hooks';
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapInputHandlers() {
  const dispatch = useDispatch();
  const type = useSelector((state: AppState) => state.swap.type);

  const { selectedGasFee } = useGas();

  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );
  const inputCurrency = useSelector(
    (state: AppState) => state.swap.inputCurrency
  );

  const updateMaxInputAmount = useCallback(() => {
    const inputCurrencyAddress = inputCurrency?.address;
    const inputCurrencyUniqueId = inputCurrency?.uniqueId;
    const inputCurrencyNetwork = ethereumUtils.getNetworkFromType(
      inputCurrency?.type
    );

    if (type === ExchangeModalTypes.withdrawal) {
      dispatch(updateSwapInputAmount(supplyBalanceUnderlying, true));
    } else {
      const accountAsset = ethereumUtils.getAccountAsset(inputCurrencyUniqueId);
      const oldAmount = accountAsset?.balance?.amount ?? '0';
      let newAmount = oldAmount;
      if (
        isNativeAsset(inputCurrencyAddress, inputCurrencyNetwork) &&
        accountAsset
      ) {
        newAmount = toFixedDecimals(
          ethereumUtils.getBalanceAmount(selectedGasFee, accountAsset),
          6
        );
        const transactionFee = subtract(oldAmount, newAmount);
        const newAmountMinusFee = toFixedDecimals(
          subtract(newAmount, multiply(transactionFee, 1.5)),
          6
        );

        if (greaterThan(newAmountMinusFee, 0)) {
          dispatch(updateSwapInputAmount(newAmountMinusFee));
        } else {
          Alert({
            message: lang.t(
              'expanded_state.swap.swap_max_insufficient_alert.message',
              { symbol: accountAsset.symbol }
            ),
            title: lang.t(
              'expanded_state.swap.swap_max_insufficient_alert.title',
              { symbol: accountAsset.symbol }
            ),
          });
          return;
        }
      }
      dispatch(updateSwapInputAmount(newAmount, true));
    }
  }, [
    dispatch,
    inputCurrency?.address,
    inputCurrency?.type,
    inputCurrency?.uniqueId,
    selectedGasFee,
    supplyBalanceUnderlying,
    type,
  ]);

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
