import { useCallback, useMemo, useState } from 'react';
import useAccountAssets from './useAccountAssets';
import {
  convertAmountToNativeDisplay,
  multiply,
  updatePrecisionToDisplay,
} from '@rainbow-me/helpers/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapDetails() {
  const [extraTradeDetails, setExtraTradeDetails] = useState({});
  const { allAssets } = useAccountAssets();

  const updateExtraTradeDetails = useCallback(
    ({ inputCurrency, nativeCurrency, outputCurrency, tradeDetails }) => {
      let inputExecutionRate = '';
      let inputNativePrice = '';
      let outputExecutionRate = '';
      let outputNativePrice = '';
      let outputPriceValue = '';

      let inputPriceValue = null;

      if (outputCurrency) {
        const outputCurrencyInWallet = ethereumUtils.getAsset(
          allAssets,
          outputCurrency.address
        );
        outputPriceValue = outputCurrencyInWallet?.native?.price?.amount;
      }

      if (inputCurrency) {
        inputPriceValue = inputCurrency?.native?.price?.amount;
        inputExecutionRate = tradeDetails?.executionPrice?.toSignificant();

        // If the input currency's price is unknown, then calculate its price
        // based off of the output currency price
        if (!inputPriceValue && outputPriceValue) {
          inputPriceValue = multiply(outputPriceValue, inputExecutionRate);
        }

        inputExecutionRate = updatePrecisionToDisplay(
          inputExecutionRate,
          inputPriceValue
        );

        inputNativePrice = inputPriceValue
          ? convertAmountToNativeDisplay(inputPriceValue, nativeCurrency)
          : '-';
      }

      if (outputCurrency) {
        if (tradeDetails.executionPrice.equalTo(0)) {
          outputExecutionRate = '0';
        } else {
          outputExecutionRate = tradeDetails?.executionPrice
            ?.invert()
            ?.toSignificant();
        }

        // If the output currency was not found in wallet and the input currency has a price
        // Calculate the output currency price based off of the input currency price
        if (!outputPriceValue && inputPriceValue) {
          outputPriceValue = multiply(inputPriceValue, outputExecutionRate);
        }

        outputExecutionRate = updatePrecisionToDisplay(
          outputExecutionRate,
          outputPriceValue
        );

        outputNativePrice = outputPriceValue
          ? convertAmountToNativeDisplay(outputPriceValue, nativeCurrency)
          : '-';
      }

      setExtraTradeDetails({
        inputExecutionRate,
        inputNativePrice,
        inputPriceValue,
        outputExecutionRate,
        outputNativePrice,
        outputPriceValue,
      });
    },
    [allAssets]
  );

  const areTradeDetailsValid = useMemo(
    () =>
      !!(
        extraTradeDetails?.inputExecutionRate &&
        extraTradeDetails?.inputNativePrice &&
        extraTradeDetails?.outputExecutionRate &&
        extraTradeDetails?.outputNativePrice
      ),
    [extraTradeDetails]
  );

  return {
    areTradeDetailsValid,
    extraTradeDetails,
    updateExtraTradeDetails,
  };
}
