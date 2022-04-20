import lang from 'i18n-js';
import React from 'react';
import useRainbowFee from '../../../hooks/useRainbowFee';
import SwapDetailsRow from './SwapDetailsRow';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';

export default function SwapDetailsUniswapRow(tradeDetails) {
  const { nativeCurrencySymbol } = useAccountSettings();
  const { rainbowFeeNative, rainbowFeePercentage } = useRainbowFee(
    tradeDetails
  );

  //TODO: this isnt i18n friendly
  const rainbowFeeNativeDisplay = `${nativeCurrencySymbol}${rainbowFeeNative} `;
  const rainbowFeePercentageDisplay = `${rainbowFeePercentage}%`;
  const steps = [rainbowFeeNativeDisplay, rainbowFeePercentageDisplay];
  const [step, nextStep] = useStepper(steps.length);

  return (
    <SwapDetailsRow
      label={`${lang.t('expanded_state.swap_details.rainbow_fee')} 􀅵`}
      valuePress={nextStep}
    >
      {steps[step]}
    </SwapDetailsRow>
  );
}
