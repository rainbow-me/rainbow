import lang from 'i18n-js';
import React from 'react';
import useRainbowFee from '../../../hooks/useRainbowFee';
import SwapDetailsRow from './SwapDetailsRow';
import {
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
} from '@rainbow-me/helpers/utilities';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

export default function SwapDetailsUniswapRow(tradeDetails) {
  const { navigate } = useNavigation();
  const { nativeCurrency } = useAccountSettings();
  const { rainbowFeeNative, rainbowFeePercentage } = useRainbowFee(
    tradeDetails
  );

  const rainbowFeeNativeDisplay = convertAmountToNativeDisplay(
    rainbowFeeNative,
    nativeCurrency
  );
  const rainbowFeePercentageDisplay = convertAmountToPercentageDisplayWithThreshold(
    rainbowFeePercentage
  );
  const steps = [rainbowFeeNativeDisplay, rainbowFeePercentageDisplay];
  const [step, nextStep] = useStepper(steps.length);

  const handleLabelPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      feePercentage: rainbowFeePercentageDisplay,
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
