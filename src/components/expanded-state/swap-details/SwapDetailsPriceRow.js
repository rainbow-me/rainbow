import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { convertRawAmountToDecimalFormat, divide, handleSignificantDecimals } from '@/helpers/utilities';
import { useStepper, useSwapCurrencies } from '@/hooks';

export default function SwapDetailsPriceRow({ tradeDetails, ...props }) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const convertedSellAmount = convertRawAmountToDecimalFormat(tradeDetails?.sellAmount, inputCurrency.decimals);

  const convertedBuyAmount = convertRawAmountToDecimalFormat(tradeDetails?.buyAmount, outputCurrency.decimals);

  const outputExecutionRateRaw = divide(convertedSellAmount, convertedBuyAmount);

  const inputExecutionRateRaw = divide(convertedBuyAmount, convertedSellAmount);

  const inputExecutionRate = handleSignificantDecimals(inputExecutionRateRaw, 2);

  const outputExecutionRate = handleSignificantDecimals(outputExecutionRateRaw, 2);

  const steps = useMemo(
    () => [
      lang.t('expanded_state.swap_details.output_exchange_rate', {
        executionRate: outputExecutionRate,
        inputSymbol: inputCurrency?.symbol,
        outputSymbol: outputCurrency?.symbol,
      }),
      lang.t('expanded_state.swap_details.input_exchange_rate', {
        executionRate: inputExecutionRate,
        inputSymbol: inputCurrency?.symbol,
        outputSymbol: outputCurrency?.symbol,
      }),
    ],
    [inputCurrency, inputExecutionRate, outputCurrency, outputExecutionRate]
  );

  const [step, nextStep] = useStepper(steps.length);

  return (
    <ButtonPressAnimation {...props} onPress={nextStep} scaleTo={1.06}>
      <SwapDetailsRow label={lang.t('expanded_state.swap_details.exchange_rate')}>
        <SwapDetailsValue letterSpacing="roundedTight">{steps[step]}</SwapDetailsValue>
        <SwapDetailsValue>{` 􀅌`}</SwapDetailsValue>
      </SwapDetailsRow>
    </ButtonPressAnimation>
  );
}
