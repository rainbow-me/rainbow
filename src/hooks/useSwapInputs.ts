import analytics from '@segment/analytics-react-native';
import { RefObject, useCallback, useEffect, useMemo } from 'react';
import { TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import usePrevious from './usePrevious';
import useSwapDetails from './useSwapDetails';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import { Asset } from '@rainbow-me/entities';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertStringToNumber,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/helpers/utilities';
import {
  updateIsMax,
  updateIsSufficientBalance,
  updateSwapInputAmount,
  updateSwapNativeAmount,
  updateSwapOutputAmount,
} from '@rainbow-me/redux/swap';
import logger from 'logger';

interface UniswapAsset extends Asset {
  native?: {
    price?: {
      amount: string;
    };
  };
}

export default function useSwapInputs({
  defaultInputAsset,
  isWithdrawal,
  maxInputBalance,
  nativeFieldRef,
  supplyBalanceUnderlying,
  type,
}: {
  defaultInputAsset: Asset;
  isWithdrawal: boolean;
  maxInputBalance: string;
  nativeFieldRef: RefObject<TextInput>;
  supplyBalanceUnderlying: string;
  type: string;
}) {
  const dispatch = useDispatch();
  const { extraTradeDetails } = useSwapDetails();
  const { inputAmount } = useSwapInputValues();
  const {
    inputCurrency,
  }: { inputCurrency: UniswapAsset } = useSwapInputOutputTokens();

  const inputPriceValue = useMemo(
    () =>
      // If the input currency's price is unknown, fall back to using
      // the price we derive from the output currency's price + inputExecutionRate
      inputCurrency?.native?.price?.amount ||
      extraTradeDetails?.inputPriceValue,
    [extraTradeDetails, inputCurrency]
  );
  const prevInputPriceValue = usePrevious(inputPriceValue);

  const forceUpdateNativeAmount = useCallback(
    amount => {
      if (!nativeFieldRef?.current?.isFocused?.()) {
        dispatch(
          updateSwapNativeAmount(
            amount && inputPriceValue && !isZero(amount)
              ? convertAmountToNativeAmount(amount, inputPriceValue)
              : null
          )
        );
      }
    },
    [dispatch, inputPriceValue, nativeFieldRef]
  );

  useEffect(() => {
    // When the user has selected an input currency which we do not have price data for,
    // we need to forcibly sync the "nativeAmount" input because the derived
    // `extraTradeDetails?.inputPriceValue` price will be inaccurate for the first render.
    if (
      inputAmount &&
      !isZero(inputAmount) &&
      inputPriceValue !== prevInputPriceValue
    ) {
      forceUpdateNativeAmount(inputAmount);
    }
  }, [
    forceUpdateNativeAmount,
    inputAmount,
    inputPriceValue,
    prevInputPriceValue,
  ]);

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
        forceUpdateNativeAmount(newInputAmount);

        if (inputCurrency) {
          const newIsSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(maxInputBalance, newInputAmount));

          dispatch(updateIsSufficientBalance(newIsSufficientBalance));
        }
      }

      if (newAmountDisplay) {
        analytics.track('Updated input amount', {
          defaultInputAsset: defaultInputAsset?.symbol,
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [
      defaultInputAsset,
      dispatch,
      forceUpdateNativeAmount,
      inputCurrency,
      isWithdrawal,
      maxInputBalance,
      nativeFieldRef,
      supplyBalanceUnderlying,
      type,
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
    [dispatch, inputCurrency, inputPriceValue]
  );

  const updateOutputAmount = useCallback(
    (newOutputAmount, newAmountDisplay, newInputAsExactAmount = false) => {
      const display = newAmountDisplay || newOutputAmount;
      dispatch(
        updateSwapOutputAmount(newOutputAmount, display, newInputAsExactAmount)
      );
      if (newAmountDisplay) {
        analytics.track('Updated output amount', {
          defaultInputAsset: defaultInputAsset?.symbol,
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [defaultInputAsset, dispatch, type]
  );

  return {
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
