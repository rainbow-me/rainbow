import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from '../components/alerts';
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
import { ETH_ADDRESS } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapInputHandlers() {
  const dispatch = useDispatch();
  const type = useSelector((state: AppState) => state.swap.type);

  const { selectedGasFee } = useGas();

  const supplyBalanceUnderlying = useSelector(
    (state: AppState) =>
      state.swap.typeSpecificParameters?.supplyBalanceUnderlying
  );
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );

  const updateMaxInputAmount = useCallback(() => {
    if (type === ExchangeModalTypes.withdrawal) {
      dispatch(updateSwapInputAmount(supplyBalanceUnderlying));
    } else {
      const accountAsset = ethereumUtils.getAccountAsset(inputCurrencyAddress);
      const oldAmount = accountAsset?.balance?.amount ?? '0';
      let newAmount = oldAmount;
      if (inputCurrencyAddress === ETH_ADDRESS && accountAsset) {
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
          Alert({
            buttons: [
              { style: 'cancel', text: 'No thanks' },
              {
                onPress: () => {
                  dispatch(updateSwapInputAmount(newAmountMinusFee));
                },
                text: 'Auto adjust',
              },
            ],
            message: `You are about to swap all the ${inputCurrencyAddress.toUpperCase()} available in your wallet. If you want to swap back to ${inputCurrencyAddress.toUpperCase()}, you may not be able to afford the fee.
      
  Would you like to auto adjust the balance to leave some ${inputCurrencyAddress.toUpperCase()}?`,
            title: 'Are you sure?',
          });
        }
      }
      dispatch(updateSwapInputAmount(newAmount));
    }
  }, [
    dispatch,
    inputCurrencyAddress,
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
