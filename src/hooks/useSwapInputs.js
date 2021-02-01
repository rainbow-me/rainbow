import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { useCallback, useState } from 'react';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertStringToNumber,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import logger from 'logger';

export default function useSwapInputs({
  defaultInputAsset,
  inputCurrency,
  isDeposit,
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

      if (
        (nativeFieldRef &&
          nativeFieldRef.current &&
          !nativeFieldRef.current.isFocused()) ||
        newIsMax
      ) {
        let newNativeAmount = null;

        const isInputZero = isZero(newInputAmount);

        if (newInputAmount && !isInputZero) {
          const newNativePrice = get(
            inputCurrency,
            'native.price.amount',
            null
          );
          newNativeAmount = convertAmountToNativeAmount(
            newInputAmount,
            newNativePrice
          );
        }
        setNativeAmount(newNativeAmount);

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
          category: isDeposit ? 'savings' : 'swap',
          defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [
      defaultInputAsset,
      inputCurrency,
      isDeposit,
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

      const isNativeZero = isZero(nativeAmount);
      setNativeAmount(nativeAmount);

      setIsMax(false);

      if (nativeAmount && !isNativeZero) {
        const nativePrice = get(inputCurrency, 'native.price.amount', null);
        inputAmount = convertAmountFromNativeValue(
          nativeAmount,
          nativePrice,
          inputCurrency.decimals
        );
        inputAmountDisplay = updatePrecisionToDisplay(
          inputAmount,
          nativePrice,
          true
        );
      }

      setInputAsExactAmount(true);
      setInputAmount(inputAmount);
      setInputAmountDisplay(inputAmountDisplay);
    },
    [inputCurrency]
  );

  const updateOutputAmount = useCallback(
    (newOutputAmount, newAmountDisplay, newInputAsExactAmount = false) => {
      setInputAsExactAmount(newInputAsExactAmount);
      setOutputAmount(newOutputAmount);
      setOutputAmountDisplay(newAmountDisplay || newOutputAmount);
      if (newAmountDisplay) {
        analytics.track('Updated output amount', {
          category: isWithdrawal || isDeposit ? 'savings' : 'swap',
          defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [defaultInputAsset, isDeposit, isWithdrawal, type]
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
