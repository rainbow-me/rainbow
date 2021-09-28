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
      `${inputExecutionRate} ${outputCurrency?.symbol} per ${inputCurrency?.symbol}`,
      `${outputExecutionRate} ${inputCurrency?.symbol} per ${outputCurrency?.symbol}`,
    ],
    [inputCurrency, inputExecutionRate, outputCurrency, outputExecutionRate]
  );

  const [step, nextStep] = useStepper(steps.length);
  const { colors } = useTheme();

  return (
    <ButtonPressAnimation {...props} onPress={nextStep} scaleTo={1.06}>
      <SwapDetailsRow label="Rate">
        <SwapDetailsValue letterSpacing="roundedTight">
          {steps[step]}
        </SwapDetailsValue>
        <SwapDetailsValue color={colors.alpha(colors.blueGreyDark, 0.5)}>
          {` 􀅌`}
        </SwapDetailsValue>
      </SwapDetailsRow>
    </ButtonPressAnimation>
  );
}
