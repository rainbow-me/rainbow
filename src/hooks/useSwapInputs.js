import analytics from '@segment/analytics-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import usePrevious from './usePrevious';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertStringToNumber,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/helpers/utilities';
import logger from 'logger';

export default function useSwapInputs({
  category,
  defaultInputAsset,
  extraTradeDetails,
  inputCurrency,
  isWithdrawal,
  maxInputBalance,
  nativeFieldRef,
  supplyBalanceUnderlying,
  type,
}) {
  const [isMax, setIsMax] = useState(false);
  const [inputAmount, setInputAmount] = useState(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState(null);
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [nativeAmount, setNativeAmount] = useState(null);
  const [outputAmount, setOutputAmount] = useState(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState(null);

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
        setNativeAmount(
          amount && !isZero(amount)
            ? convertAmountToNativeAmount(amount, inputPriceValue)
            : null
        );
      }
    },
    [inputPriceValue, nativeFieldRef]
  );

  useEffect(() => {
    // When the user has selected an input currency which we do not have price data for,
    // we need to forcibly sync the "nativeAmount" input because the derived
    // `extraTradeDetails?.inputPriceValue` price will be inaccurate for the first render.
    if (!isZero(inputAmount) && inputPriceValue !== prevInputPriceValue) {
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
      setInputAmount(newInputAmount);
      setInputAsExactAmount(newInputAsExactAmount);
      setInputAmountDisplay(newAmountDisplay || newInputAmount);
      setIsMax(!!newInputAmount && newIsMax);

      if (newIsMax || !nativeFieldRef?.current?.isFocused?.()) {
        forceUpdateNativeAmount(newInputAmount);
        if (inputCurrency) {
          const newIsSufficientBalance =
            !newInputAmount ||
            (isWithdrawal
              ? greaterThanOrEqualTo(supplyBalanceUnderlying, newInputAmount)
              : greaterThanOrEqualTo(maxInputBalance, newInputAmount));

          setIsSufficientBalance(newIsSufficientBalance);
        }
      }

      if (newAmountDisplay) {
        analytics.track('Updated input amount', {
          category,
          defaultInputAsset: defaultInputAsset?.symbol,
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [
      category,
      defaultInputAsset,
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

      setNativeAmount(nativeAmount);
      setIsMax(false);

      if (nativeAmount && !isZero(nativeAmount)) {
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

      setInputAsExactAmount(true);
      setInputAmount(inputAmount);
      setInputAmountDisplay(inputAmountDisplay);
    },
    [inputCurrency, inputPriceValue]
  );

  const updateOutputAmount = useCallback(
    (newOutputAmount, newAmountDisplay, newInputAsExactAmount = false) => {
      setInputAsExactAmount(newInputAsExactAmount);
      setOutputAmount(newOutputAmount);
      setOutputAmountDisplay(newAmountDisplay || newOutputAmount);
      if (newAmountDisplay) {
        analytics.track('Updated output amount', {
          category,
          defaultInputAsset: defaultInputAsset?.symbol,
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [category, defaultInputAsset, type]
  );

  return {
    inputAmount,
    inputAmountDisplay,
    inputAsExactAmount,
    isMax,
    isSufficientBalance,
    nativeAmount,
    outputAmount,
    outputAmountDisplay,
    setIsSufficientBalance,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  };
}
