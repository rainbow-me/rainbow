import { RefObject, useCallback } from 'react';
import { TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import { UniswapCurrency } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import {
  resetSwapAmounts,
  updateIsMax,
  updateIsSufficientBalance,
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import logger from 'logger';

export default function useSwapInputs({
  isWithdrawal,
  maxInputBalance,
  nativeFieldRef,
  supplyBalanceUnderlying,
}: {
  isWithdrawal: boolean;
  maxInputBalance: string;
  nativeFieldRef: RefObject<TextInput>;
  supplyBalanceUnderlying: string;
}) {
  const dispatch = useDispatch();
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );
  const {
    inputCurrency,
  }: { inputCurrency: UniswapCurrency } = useSwapInputOutputTokens();

  const updateInputAmount = useCallback(
    (
      newInputAmount,
      newAmountDisplay,
      newInputAsExactAmount = true,
      newIsMax = false
    ) => {
      const display = newAmountDisplay || newInputAmount;
      dispatch(
        updateSwapInputAmount(newInputAmount, display, newInputAsExactAmount)
      );
      dispatch(updateIsMax(!!newInputAmount && newIsMax));

      if (newIsMax || !nativeFieldRef?.current?.isFocused?.()) {
        const inputPriceValue =
          genericAssets[inputCurrency?.address]?.price?.value || 0;
        dispatch(
          updateSwapNativeAmount(
            newInputAmount && inputPriceValue && !isZero(newInputAmount)
              ? convertAmountToNativeAmount(newInputAmount, inputPriceValue)
              : null
          )
        );

        if (inputCurrency) {
          const newIsSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(maxInputBalance, newInputAmount));

          dispatch(updateIsSufficientBalance(newIsSufficientBalance));
        }
      }
    },
    [
      dispatch,
      genericAssets,
      inputCurrency,
      isWithdrawal,
      maxInputBalance,
      nativeFieldRef,
      supplyBalanceUnderlying,
    ]
  );

  const updateNativeAmount = useCallback(
    nativeAmount => {
      logger.log('update native amount', nativeAmount);

      if (!inputCurrency) return;

      let inputAmount = null;
      let inputAmountDisplay = null;

      dispatch(updateSwapNativeAmount(nativeAmount));
      dispatch(updateIsMax(false));

      const inputPriceValue =
        genericAssets[inputCurrency.address]?.price?.value || 0;

      if (nativeAmount && inputPriceValue && !isZero(nativeAmount)) {
        inputAmount = convertAmountFromNativeValue(
          nativeAmount,
          inputPriceValue,
          inputCurrency.decimals
        );
        inputAmountDisplay = updatePrecisionToDisplay(
          inputAmount,
          inputPriceValue,
          true
        );
      }

      dispatch(updateSwapInputAmount(inputAmount, inputAmountDisplay, true));
    },
    [dispatch, genericAssets, inputCurrency]
  );

  const updateOutputAmount = useCallback(
    (newOutputAmount, newAmountDisplay, newInputAsExactAmount = false) => {
      const display = newAmountDisplay || newOutputAmount;
      dispatch(
        updateSwapOutputAmount(newOutputAmount, display, newInputAsExactAmount)
      );
    },
    [dispatch]
  );

  const resetAmounts = useCallback(() => {
    dispatch(resetSwapAmounts());
  }, [dispatch]);

  return {
    resetAmounts,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
