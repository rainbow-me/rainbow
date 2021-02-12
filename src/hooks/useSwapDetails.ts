import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import { AppState } from '@rainbow-me/redux/store';
import {
  updateSwapExtraDetails,
  updateSlippage as updateSwapSlippage,
  updateSwapTradeDetails,
} from '@rainbow-me/redux/swap';
import {
  convertAmountToNativeDisplay,
  multiply,
  updatePrecisionToDisplay,
} from '@rainbow-me/utilities';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useSwapDetails() {
  const dispatch = useDispatch();
  const tradeDetails = useSelector(
    (state: AppState) => state.swap.tradeDetails
  );
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const extraTradeDetails = useSelector(
    (state: AppState) => state.swap.extraTradeDetails
  );
  const slippage = useSelector((state: AppState) => state.swap.slippage);

  const { allAssets } = useAccountAssets();
  const { nativeCurrency } = useAccountSettings();

  const updateTradeDetails = useCallback(
    newTradeDetails => {
      dispatch(updateSwapTradeDetails(newTradeDetails));
    },
    [dispatch]
  );

  const updateExtraTradeDetails = useCallback(() => {
    let inputExecutionRate = '';
    let inputNativePrice = '';
    let outputExecutionRate = '';
    let outputNativePrice = '';
    let outputPriceValue = '';

    let inputPriceValue = null;

    if (inputCurrency) {
      inputPriceValue = inputCurrency?.native?.price?.amount;

      inputExecutionRate = tradeDetails?.executionPrice?.toSignificant();

      inputExecutionRate = inputPriceValue
        ? updatePrecisionToDisplay(inputExecutionRate, inputPriceValue)
        : '0';

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
  }, [
    allAssets,
    dispatch,
    inputCurrency,
    nativeCurrency,
    outputCurrency,
    tradeDetails,
  ]);

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

  const updateSlippage = useCallback(() => {
    const slippage = tradeDetails?.priceImpact
      ? Number(tradeDetails?.priceImpact?.toFixed(2).toString()) * 100
      : 0;
    dispatch(updateSwapSlippage(slippage));
  }, [dispatch, tradeDetails]);

  return {
    areTradeDetailsValid: !!areTradeDetailsValid,
    extraTradeDetails,
    slippage,
    tradeDetails,
    updateExtraTradeDetails,
    updateSlippage,
    updateTradeDetails,
  };
}
