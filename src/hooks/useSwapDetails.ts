import { Trade } from '@uniswap/sdk';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import { UniswapCurrency } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { updateSwapExtraDetails } from '@rainbow-me/redux/swap';
import {
  convertAmountToNativeDisplay,
  multiply,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapDetails() {
  const dispatch = useDispatch();
  const extraTradeDetails = useSelector(
    (state: AppState) => state.swap.extraTradeDetails
  );

  const { allAssets } = useAccountAssets();

  const updateExtraTradeDetails = useCallback(
    ({
      inputCurrency,
      nativeCurrency,
      outputCurrency,
      tradeDetails,
    }: {
      inputCurrency: UniswapCurrency;
      nativeCurrency: string;
      outputCurrency: UniswapCurrency;
      tradeDetails: Trade;
    }) => {
      let inputExecutionRate = '';
      let inputNativePrice = '';
      let outputExecutionRate = '';
      let outputNativePrice = '';
      let outputPriceValue = '';

      let inputPriceValue = null;

      if (inputCurrency) {
        inputPriceValue = inputCurrency?.native?.price?.amount;

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

        outputPriceValue = outputCurrencyInWallet?.native?.price?.amount;

        if (tradeDetails.executionPrice.equalTo('0')) {
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

      dispatch(
        updateSwapExtraDetails({
          inputExecutionRate,
          inputNativePrice,
          outputExecutionRate,
          outputNativePrice,
          outputPriceValue,
        })
      );
    },
    [allAssets, dispatch]
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
