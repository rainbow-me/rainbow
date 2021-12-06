import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '../../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsRow' was resolved to '/Users/... Remove this comment to see the full error message
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useStepper, useSwapCurrencies } from '@rainbow-me/hooks';

export default function SwapDetailsPriceRow({ tradeDetails, ...props }: any) {
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation {...props} onPress={nextStep} scaleTo={1.06}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsRow label="Rate">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsValue letterSpacing="roundedTight">
          {steps[step]}
        </SwapDetailsValue>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsValue color={colors.alpha(colors.blueGreyDark, 0.5)}>
          {` 􀅌`}
        </SwapDetailsValue>
      </SwapDetailsRow>
    </ButtonPressAnimation>
  );
}
