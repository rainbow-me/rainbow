import lang from 'i18n-js';
import React from 'react';
import useRainbowFee from '../../../hooks/useRainbowFee';
import SwapDetailsRow from './SwapDetailsRow';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function SwapDetailsUniswapRow(tradeDetails) {
  const { navigate } = useNavigation();
  const { nativeCurrencySymbol } = useAccountSettings();
  const { rainbowFeeNative, rainbowFeePercentage } = useRainbowFee(
    tradeDetails
  );

  //TODO: this isnt i18n friendly
  const rainbowFeeNativeDisplay = `${nativeCurrencySymbol}${rainbowFeeNative} `;
  const rainbowFeePercentageDisplay = `${rainbowFeePercentage}%`;
  const steps = [rainbowFeeNativeDisplay, rainbowFeePercentageDisplay];
  const [step, nextStep] = useStepper(steps.length);

  const handleLabelPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'rainbow_fee',
    });
  }, [navigate]);

  return (
    <SwapDetailsRow
      label={`${lang.t('expanded_state.swap_details.rainbow_fee')} 􀅵`}
      labelPress={handleLabelPress}
      valuePress={nextStep}
    >
      {steps[step]}
    </SwapDetailsRow>
  );
}
