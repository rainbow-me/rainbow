import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import {
  divide,
  handleSignificantDecimals,
} from '@rainbow-me/helpers/utilities';
import { useStepper, useSwapCurrencies } from '@rainbow-me/hooks';

export default function SwapDetailsPriceRow({ tradeDetails, ...props }) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const outputExecutionRateRaw = divide(
    tradeDetails?.sellAmount,
    tradeDetails?.buyAmount
  );
  const inputExecutionRateRaw = divide(
    tradeDetails?.buyAmount,
    tradeDetails?.sellAmount
  );

  const inputExecutionRate = handleSignificantDecimals(
    inputExecutionRateRaw,
    2
  );

  const outputExecutionRate = handleSignificantDecimals(
    outputExecutionRateRaw,
    2
  );

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
      <SwapDetailsRow
        label={lang.t('expanded_state.swap_details.exchange_rate')}
      >
        <SwapDetailsValue letterSpacing="roundedTight">
          {steps[step]}
        </SwapDetailsValue>
        <SwapDetailsValue>{` 􀅌`}</SwapDetailsValue>
      </SwapDetailsRow>
    </ButtonPressAnimation>
  );
}
