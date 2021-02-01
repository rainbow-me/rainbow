import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useStepper } from '@rainbow-me/hooks';

export default function SwapDetailsPriceRow(props) {
  const {
    params: {
      inputCurrency,
      inputExecutionRate,
      outputCurrency,
      outputExecutionRate,
    },
  } = useRoute();

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
