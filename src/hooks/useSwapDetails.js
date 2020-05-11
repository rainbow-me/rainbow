import { get } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import {
  convertAmountToNativeDisplay,
  updatePrecisionToDisplay,
} from '../helpers/utilities';
import useUniswapMarketPrice from './useUniswapMarketPrice';

export default function useSwapDetails() {
  const { getMarketPrice } = useUniswapMarketPrice();

  const [extraTradeDetails, setExtraTradeDetails] = useState({});

  const updateExtraTradeDetails = useCallback(
    ({ inputCurrency, nativeCurrency, outputCurrency, tradeDetails }) => {
      let inputExecutionRate = '';
      let inputNativePrice = '';
      let outputExecutionRate = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = getMarketPrice(inputCurrency, outputCurrency);

        inputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rate', 0),
          inputPriceValue
        );

        inputNativePrice = convertAmountToNativeDisplay(
          inputPriceValue,
          nativeCurrency
        );
      }

      if (outputCurrency) {
        const outputPriceValue = getMarketPrice(
          inputCurrency,
          outputCurrency,
          false
        );

        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', 0),
          outputPriceValue
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      setExtraTradeDetails({
        inputExecutionRate,
        inputNativePrice,
        outputExecutionRate,
        outputNativePrice,
      });
    },
    [getMarketPrice]
  );

  const areTradeDetailsValid = useMemo(() => {
    const {
      inputExecutionRate,
      inputNativePrice,
      outputExecutionRate,
      outputNativePrice,
    } = extraTradeDetails;

    return (
      inputExecutionRate &&
      inputNativePrice &&
      outputExecutionRate &&
      outputNativePrice
    );
  }, [extraTradeDetails]);

  return {
    areTradeDetailsValid,
    extraTradeDetails,
    updateExtraTradeDetails,
  };
}
