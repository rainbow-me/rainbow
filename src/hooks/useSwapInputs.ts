import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { RefObject, useCallback, useState } from 'react';
import { TextInput } from 'react-native';
import {
  convertAmountFromNativeValue,
  convertAmountToNativeAmount,
  convertStringToNumber,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import logger from 'logger';

export default function useSwapInputs({
  defaultInputAsset,
  isWithdrawal,
  maxInputBalance,
  nativeFieldRef,
  supplyBalanceUnderlying,
  type,
}: {
  defaultInputAsset: string;
  isWithdrawal: boolean;
  maxInputBalance: string;
  nativeFieldRef: RefObject<TextInput>;
  supplyBalanceUnderlying: string;
  type: string;
}) {
  const { inputCurrency } = useSwapInputOutputTokens();
  const [isMax, setIsMax] = useState(false);
  const [inputAmount, setInputAmount] = useState<string | null>(null);
  const [inputAmountDisplay, setInputAmountDisplay] = useState<string | null>(
    null
  );
  const [inputAsExactAmount, setInputAsExactAmount] = useState(true);
  const [isSufficientBalance, setIsSufficientBalance] = useState(true);
  const [nativeAmount, setNativeAmount] = useState<string | null>(null);
  const [outputAmount, setOutputAmount] = useState<string | null>(null);
  const [outputAmountDisplay, setOutputAmountDisplay] = useState<string | null>(
    null
  );

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

      if (!nativeFieldRef?.current?.isFocused() || newIsMax) {
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
          defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [
      defaultInputAsset,
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
          defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
          type,
          value: convertStringToNumber(newAmountDisplay),
        });
      }
    },
    [defaultInputAsset, type]
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
