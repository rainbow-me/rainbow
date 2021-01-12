import { get } from 'lodash';
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

      if (inputCurrency) {
        inputPriceValue = get(inputCurrency, 'native.price.amount', null);

        inputExecutionRate = tradeDetails?.executionPrice?.toSignificant();

        inputExecutionRate = updatePrecisionToDisplay(
          inputExecutionRate,
          inputPriceValue
        );

        inputNativePrice = inputPriceValue
          ? convertAmountToNativeDisplay(inputPriceValue, nativeCurrency)
          : '-';
      }

      if (outputCurrency) {
        const outputCurrencyInWallet = ethereumUtils.getAsset(
          allAssets,
          outputCurrency.address
        );

        outputPriceValue = get(
          outputCurrencyInWallet,
          'native.price.amount',
          null
        );

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
        outputExecutionRate,
        outputNativePrice,
        outputPriceValue,
      });
    },
    [allAssets]
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
    areTradeDetailsValid: !!areTradeDetailsValid,
    extraTradeDetails,
    updateExtraTradeDetails,
  };
}
