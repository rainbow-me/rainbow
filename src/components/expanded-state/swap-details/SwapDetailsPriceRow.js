import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useStepper, useSwapCurrencies } from '@rainbow-me/hooks';

export default function SwapDetailsPriceRow({ tradeDetails, ...props }) {
  const inputExecutionRate = tradeDetails?.executionPrice?.toSignificant();
  let outputExecutionRate = '0';
  if (!tradeDetails?.executionPrice?.equalTo('0')) {
    outputExecutionRate = tradeDetails?.executionPrice
      ?.invert()
      ?.toSignificant();
  }

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

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
