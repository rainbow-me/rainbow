import BigNumber from 'bignumber.js';
import { get } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import {
  convertAmountToNativeDisplay,
  updatePrecisionToDisplay,
} from '../helpers/utilities';

export default function useSwapDetails() {
  const [extraTradeDetails, setExtraTradeDetails] = useState({});

  const updateExtraTradeDetails = useCallback(
    ({
      getMarketPrice,
      inputCurrency,
      nativeCurrency,
      outputCurrency,
      tradeDetails,
    }) => {
      let inputExecutionRate = '';
      let inputNativePrice = '';
      let outputExecutionRate = '';
      let outputNativePrice = '';

      if (inputCurrency) {
        const inputPriceValue = getMarketPrice();
        inputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rate', BigNumber(0)),
          inputPriceValue
        );

        inputNativePrice = convertAmountToNativeDisplay(
          inputPriceValue,
          nativeCurrency
        );
      }

      if (outputCurrency) {
        const outputPriceValue = getMarketPrice(false);
        outputExecutionRate = updatePrecisionToDisplay(
          get(tradeDetails, 'executionRate.rateInverted', BigNumber(0)),
          outputPriceValue
        );

        outputNativePrice = convertAmountToNativeDisplay(
          outputPriceValue,
          nativeCurrency
        );
      }

      // TODO JIN - swap details
      setExtraTradeDetails({
        inputExecutionRate,
        inputNativePrice,
        outputExecutionRate,
        outputNativePrice,
      });
    },
    []
  );
  const areTradeDetailsValid = useMemo(() => {
    const {
      inputExecutionRate,
      inputNativePrice,
      outputExecutionRate,
      outputNativePrice,
    } = extraTradeDetails;

    return (
      inputExecutionRate !== 'NaN' &&
      inputExecutionRate &&
      inputNativePrice &&
      outputExecutionRate !== 'NaN' &&
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
