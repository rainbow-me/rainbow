import { Trade } from '@uniswap/sdk';
import { get, isEmpty } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput } from 'react-native';
import { calculateTradeDetails } from '../handlers/uniswap';
import {
  convertAmountFromNativeValue,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import useAccountSettings from './useAccountSettings';
import useUniswapPairs from './useUniswapPairs';
import { Asset } from '@rainbow-me/entities';
import logger from 'logger';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

export default function useUniswapMarketDetails({
  defaultInputAddress,
  extraTradeDetails,
  inputAmount,
  inputAsExactAmount,
  inputCurrency,
  inputFieldRef,
  isDeposit,
  isWithdrawal,
  maxInputBalance,
  nativeCurrency,
  outputAmount,
  outputCurrency,
  outputFieldRef,
  setIsSufficientBalance,
  setSlippage,
  updateExtraTradeDetails,
  updateInputAmount,
  updateOutputAmount,
}: {
  defaultInputAddress: string;
  extraTradeDetails: { outputPriceValue: string };
  inputAmount: string;
  inputAsExactAmount: boolean;
  inputCurrency: Asset;
  inputFieldRef: RefObject<TextInput>;
  isDeposit: boolean;
  isWithdrawal: boolean;
  maxInputBalance: string;
  nativeCurrency: string;
  outputAmount: string;
  outputCurrency: Asset;
  outputFieldRef: RefObject<TextInput>;
  setIsSufficientBalance: (isSufficientBalance: boolean) => void;
  setSlippage: (slippage: number) => void;
  updateExtraTradeDetails: (extraTradeDetails: {
    inputCurrency: Asset;
    nativeCurrency: string;
    outputCurrency: Asset;
    tradeDetails: Trade | null;
  }) => void;
  updateInputAmount: (
    newInputAmount: string | undefined,
    newAmountDisplay: string | undefined,
    newInputAsExactAmount?: boolean,
    newIsMax?: boolean
  ) => void;
  updateOutputAmount: (
    newOutputAmount: string | null,
    newAmountDisplay: string | null,
    newInputAsExactAmount?: boolean
  ) => void;
}) {
  const [isSufficientLiquidity, setIsSufficientLiquidity] = useState(true);
  const [tradeDetails, setTradeDetails] = useState<Trade | null>(null);
  const { chainId } = useAccountSettings();

  const { allPairs, doneLoadingResults } = useUniswapPairs(
    inputCurrency,
    outputCurrency
  );
  const swapNotNeeded = useMemo(() => {
    return (
      (isDeposit || isWithdrawal) &&
      get(inputCurrency, 'address') === defaultInputAddress
    );
  }, [defaultInputAddress, inputCurrency, isDeposit, isWithdrawal]);
  const isMissingCurrency = !inputCurrency || !outputCurrency;

  const isMissingAmounts =
    (isEmpty(inputAmount) || isZero(inputAmount)) &&
    (isEmpty(outputAmount) || isZero(outputAmount));

  const updateTradeDetails = useCallback(() => {
    let updatedInputAmount = inputAmount;
    let updatedInputAsExactAmount = inputAsExactAmount;

    if (isMissingAmounts) {
      const inputNativePrice = get(inputCurrency, 'native.price.amount', null);
      updatedInputAmount = convertAmountFromNativeValue(
        DEFAULT_NATIVE_INPUT_AMOUNT,
        inputNativePrice,
        inputCurrency.decimals
      );
      updatedInputAsExactAmount = true;
    }

    const newTradeDetails = calculateTradeDetails(
      chainId,
      updatedInputAmount,
      outputAmount,
      inputCurrency,
      outputCurrency,
      allPairs,
      updatedInputAsExactAmount
    );

    const hasInsufficientLiquidity =
      doneLoadingResults && (isEmpty(allPairs) || !newTradeDetails);
    setIsSufficientLiquidity(!hasInsufficientLiquidity);

    setTradeDetails(newTradeDetails);
  }, [
    doneLoadingResults,
    allPairs,
    chainId,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    isMissingAmounts,
    outputAmount,
    outputCurrency,
  ]);

  const calculateInputGivenOutputChange = useCallback(
    ({ isOutputEmpty, isOutputZero }) => {
      if (isOutputEmpty || isOutputZero) {
        updateInputAmount(undefined, undefined, false);
        setIsSufficientBalance(true);
      } else {
        if (!tradeDetails) return;
        const rawUpdatedInputAmount = tradeDetails?.inputAmount?.toExact();

        const updatedInputAmountDisplay = updatePrecisionToDisplay(
          rawUpdatedInputAmount,
          get(inputCurrency, 'price.value'),
          true
        );
        updateInputAmount(
          rawUpdatedInputAmount,
          updatedInputAmountDisplay,
          inputAsExactAmount
        );

        const isSufficientAmountToTrade =
          !rawUpdatedInputAmount ||
          greaterThanOrEqualTo(maxInputBalance, rawUpdatedInputAmount);
        setIsSufficientBalance(isSufficientAmountToTrade);
      }
    },
    [
      inputAsExactAmount,
      inputCurrency,
      maxInputBalance,
      setIsSufficientBalance,
      tradeDetails,
      updateInputAmount,
    ]
  );

  const calculateOutputGivenInputChange = useCallback(
    ({ isInputEmpty, isInputZero }) => {
      logger.log('calculate OUTPUT given INPUT change');
      if (
        (isInputEmpty || isInputZero) &&
        outputFieldRef &&
        outputFieldRef.current &&
        !outputFieldRef.current.isFocused()
      ) {
        updateOutputAmount(null, null, true);
      } else {
        if (!tradeDetails) return;
        const rawUpdatedOutputAmount = tradeDetails?.outputAmount?.toExact();
        if (!isZero(rawUpdatedOutputAmount)) {
          const { outputPriceValue } = extraTradeDetails;
          const updatedOutputAmountDisplay = updatePrecisionToDisplay(
            rawUpdatedOutputAmount,
            outputPriceValue
          );

          updateOutputAmount(
            rawUpdatedOutputAmount,
            updatedOutputAmountDisplay,
            inputAsExactAmount
          );
        }
      }
    },
    [
      extraTradeDetails,
      inputAsExactAmount,
      outputFieldRef,
      tradeDetails,
      updateOutputAmount,
    ]
  );

  const updateInputOutputAmounts = useCallback(() => {
    try {
      if (isMissingAmounts) return;

      const newIsSufficientBalance =
        !inputAmount || greaterThanOrEqualTo(maxInputBalance, inputAmount);

      setIsSufficientBalance(newIsSufficientBalance);

      const isInputEmpty = !inputAmount;
      const isOutputEmpty = !outputAmount;

      const isInputZero = Number(inputAmount) === 0;
      const isOutputZero = Number(outputAmount) === 0;

      // update output amount given input amount changes
      if (inputAsExactAmount) {
        calculateOutputGivenInputChange({
          isInputEmpty,
          isInputZero,
        });
      }

      // update input amount given output amount changes
      if (
        !inputAsExactAmount &&
        inputFieldRef &&
        inputFieldRef.current &&
        !inputFieldRef.current.isFocused()
      ) {
        calculateInputGivenOutputChange({
          isOutputEmpty,
          isOutputZero,
        });
      }
    } catch (error) {
      logger.log('error getting market details', error);
    }
  }, [
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
    inputAmount,
    inputAsExactAmount,
    inputFieldRef,
    isMissingAmounts,
    maxInputBalance,
    outputAmount,
    setIsSufficientBalance,
  ]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency) return;
    updateTradeDetails();
  }, [isMissingCurrency, swapNotNeeded, updateTradeDetails]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency) return;
    updateInputOutputAmounts();
  }, [isMissingCurrency, swapNotNeeded, updateInputOutputAmounts]);

  useEffect(() => {
    if (swapNotNeeded || isMissingCurrency || !tradeDetails) return;
    updateExtraTradeDetails({
      inputCurrency,
      nativeCurrency,
      outputCurrency,
      tradeDetails,
    });
  }, [
    inputCurrency,
    isMissingCurrency,
    nativeCurrency,
    outputCurrency,
    swapNotNeeded,
    tradeDetails,
    updateExtraTradeDetails,
  ]);

  useEffect(() => {
    // update slippage
    if (swapNotNeeded || isMissingCurrency) return;
    setSlippage(
      tradeDetails?.priceImpact && !isMissingAmounts
        ? Number(tradeDetails?.priceImpact?.toFixed(2).toString()) * 100
        : 0
    );
  }, [
    isMissingAmounts,
    isMissingCurrency,
    setSlippage,
    swapNotNeeded,
    tradeDetails,
  ]);

  return {
    isSufficientLiquidity,
    tradeDetails,
  };
}
