import analytics from '@segment/analytics-react-native';
import { get, isNil } from 'lodash';
import { useCallback, useState } from 'react';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertStringToNumber,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import { logger } from '../utils';
import useUniswapMarketPrice from './useUniswapMarketPrice';

export default function useSwapInputs({
  defaultInputAsset,
  inputCurrency,
  isDeposit,
  isWithdrawal,
  maxInputBalance,
  nativeFieldRef,
  outputCurrency,
  supplyBalanceUnderlying,
  type,
}) {
  const { getMarketPrice } = useUniswapMarketPrice();

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
          let newNativePrice = get(inputCurrency, 'native.price.amount', null);
          if (isNil(newNativePrice)) {
            newNativePrice = getMarketPrice(inputCurrency, outputCurrency);
          }
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
      getMarketPrice,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      maxInputBalance,
      nativeFieldRef,
      outputCurrency,
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
        let nativePrice = get(inputCurrency, 'native.price.amount', null);
        if (isNil(nativePrice)) {
          nativePrice = getMarketPrice(inputCurrency, outputCurrency);
        }
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

      setInputAmount(inputAmount);
      setInputAmountDisplay(inputAmountDisplay);
      setInputAsExactAmount(true);
    },
    [getMarketPrice, inputCurrency, outputCurrency]
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
