import { RefObject, useCallback } from 'react';
import { TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import { UniswapCurrency } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import {
  resetSwapAmounts,
  updateSwapInputAmount,
  updateSwapInputValues,
  updateSwapInputValuesViaNative,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import logger from 'logger';

export default function useSwapInputs({
  nativeFieldRef,
}: {
  nativeFieldRef: RefObject<TextInput>;
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
      newInputCurrency = null
    ) => {
      const display = newAmountDisplay || newInputAmount;
      dispatch(
        updateSwapInputAmount(newInputAmount, display, newInputAsExactAmount)
      );

      const inputCurrencyAddress =
        newInputCurrency?.address ?? inputCurrency?.address;
      if (!nativeFieldRef?.current?.isFocused?.()) {
        const inputPriceValue =
          genericAssets[inputCurrencyAddress]?.price?.value || 0;
        dispatch(
          updateSwapNativeAmount(
            newInputAmount && inputPriceValue && !isZero(newInputAmount)
              ? convertAmountToNativeAmount(newInputAmount, inputPriceValue)
              : null
          )
        );
      }
    },
    [dispatch, genericAssets, inputCurrency, nativeFieldRef]
  );

  const updateNativeAmount = useCallback(
    nativeAmount => {
      logger.log('update native amount', nativeAmount);

      if (!inputCurrency) return;

      let inputAmount = null;
      let inputAmountDisplay = null;

      dispatch(updateSwapNativeAmount(nativeAmount));

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

  const updateInputValues = useCallback(
    (value, isMax = false) => {
      dispatch(updateSwapInputValues(value, isMax));
    },
    [dispatch]
  );

  const updateInputValuesViaNative = useCallback(
    value => {
      dispatch(updateSwapInputValuesViaNative(value));
    },
    [dispatch]
  );

  const resetAmounts = useCallback(() => {
    dispatch(resetSwapAmounts());
  }, [dispatch]);

  return {
    resetAmounts,
    updateInputAmount,
    updateInputValues,
    updateInputValuesViaNative,
    updateNativeAmount,
    updateOutputAmount,
  };
}
