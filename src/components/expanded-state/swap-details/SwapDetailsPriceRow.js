import React, { useContext, useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContext from './SwapDetailsContext';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useStepper } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

export default function SwapDetailsPriceRow(props) {
  const {
    inputCurrency,
    inputExecutionRate,
    outputCurrency,
    outputExecutionRate,
  } = useContext(SwapDetailsContext);

  const steps = useMemo(
    () => [
      `${inputExecutionRate} ${outputCurrency?.symbol} per ${inputCurrency?.symbol}`,
      `${outputExecutionRate} ${inputCurrency?.symbol} per ${outputCurrency?.symbol}`,
    ],
    [inputCurrency, inputExecutionRate, outputCurrency, outputExecutionRate]
  );

  const [step, nextStep] = useStepper(steps.length);

  return (
    <ButtonPressAnimation {...props} onPress={nextStep} scaleTo={1.06}>
      <SwapDetailsRow label="Exchange rate">
        <SwapDetailsValue letterSpacing="roundedTight">
          {steps[step]}
        </SwapDetailsValue>
        <SwapDetailsValue color={colors.blueGreyDark50}>
          {` 􀅌`}
        </SwapDetailsValue>
      </SwapDetailsRow>
    </ButtonPressAnimation>
  );
}
