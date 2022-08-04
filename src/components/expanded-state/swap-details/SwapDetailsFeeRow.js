import lang from 'i18n-js';
import React from 'react';
import useRainbowFee from '../../../hooks/useRainbowFee';
import SwapDetailsRow from './SwapDetailsRow';
import {
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  isZero,
} from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function SwapDetailsUniswapRow({ tradeDetails, network }) {
  const { navigate } = useNavigation();
  const { nativeCurrency } = useAccountSettings();
  const { rainbowFeeNative, rainbowFeePercentage } = useRainbowFee({
    network,
    tradeDetails,
  });
  const rainbowFeeNativeDisplay =
    rainbowFeeNative &&
    convertAmountToNativeDisplay(rainbowFeeNative, nativeCurrency);
  const rainbowFeePercentageDisplay = isZero(rainbowFeePercentage)
    ? '0.00%'
    : convertAmountToPercentageDisplayWithThreshold(rainbowFeePercentage);
  const steps = rainbowFeeNativeDisplay
    ? [rainbowFeeNativeDisplay, rainbowFeePercentageDisplay]
    : [rainbowFeePercentageDisplay];
  const [step, nextStep] = useStepper(steps.length);

  const handleLabelPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      feePercentage: rainbowFeePercentageDisplay,
      type: 'rainbow_fee',
    });
  }, [navigate, rainbowFeePercentageDisplay]);

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
