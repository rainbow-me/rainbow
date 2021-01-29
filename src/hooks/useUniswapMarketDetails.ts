import { Trade } from '@uniswap/sdk';
import { get, isEmpty } from 'lodash';
import { RefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { TextInput } from 'react-native';
import useAccountSettings from './useAccountSettings';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useSwapInputValues from './useSwapInputValues';
import useUniswapPairs from './useUniswapPairs';
import { Asset } from '@rainbow-me/entities';
import { calculateTradeDetails } from '@rainbow-me/handlers/uniswap';
import {
  convertAmountFromNativeValue,
  greaterThanOrEqualTo,
  isZero,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import { logger } from '@rainbow-me/utils';

const DEFAULT_NATIVE_INPUT_AMOUNT = 50;

export default function useUniswapMarketDetails({
  defaultInputAddress,
  extraTradeDetails,
  inputFieldRef,
  isDeposit,
  isWithdrawal,
  maxInputBalance,
  nativeCurrency,
  outputFieldRef,
  setSlippage,
  updateExtraTradeDetails,
  updateInputAmount,
  updateOutputAmount,
}: {
  defaultInputAddress: string;
  extraTradeDetails: { outputPriceValue: string };
  inputFieldRef: RefObject<TextInput>;
  isDeposit: boolean;
  isWithdrawal: boolean;
  maxInputBalance: string;
  nativeCurrency: string;
  outputFieldRef: RefObject<TextInput>;
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
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const {
    inputAmount,
    inputAsExactAmount,
    outputAmount,
    swapUpdateIsSufficientBalance,
  } = useSwapInputValues();

  const [isSufficientLiquidity, setIsSufficientLiquidity] = useState(true);
  const [tradeDetails, setTradeDetails] = useState<Trade | null>(null);
  const { chainId } = useAccountSettings();

  const { allPairs, doneLoadingResults } = useUniswapPairs();
  const swapNotNeeded = useMemo(() => {
    return (
      (isDeposit || isWithdrawal) &&
      get(inputCurrency, 'address') === defaultInputAddress
    );
  }, [defaultInputAddress, inputCurrency, isDeposit, isWithdrawal]);
  const isMissingCurrency = !inputCurrency || !outputCurrency;

  const isMissingAmounts =
    (isEmpty(inputAmount) || isZero(inputAmount || 0)) &&
    (isEmpty(outputAmount) || isZero(outputAmount || 0));

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
        swapUpdateIsSufficientBalance(true);
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
        swapUpdateIsSufficientBalance(isSufficientAmountToTrade);
      }
    },
    [
      inputAsExactAmount,
      inputCurrency,
      maxInputBalance,
      swapUpdateIsSufficientBalance,
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
      const isMissingAmounts = !inputAmount && !outputAmount;
      if (isMissingAmounts) return;

      const newIsSufficientBalance =
        !inputAmount || greaterThanOrEqualTo(maxInputBalance, inputAmount);

      swapUpdateIsSufficientBalance(newIsSufficientBalance);

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
    inputAmount,
    inputAsExactAmount,
    inputFieldRef,
    maxInputBalance,
    outputAmount,
    swapUpdateIsSufficientBalance,
    calculateInputGivenOutputChange,
    calculateOutputGivenInputChange,
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
    if (isMissingAmounts) {
      setSlippage(0);
      return;
    }
    const priceImpact = tradeDetails?.priceImpact
      ? tradeDetails?.priceImpact?.toFixed(2).toString()
      : 0;
    const slippage = Number(priceImpact) * 100;
    setSlippage(slippage);
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
