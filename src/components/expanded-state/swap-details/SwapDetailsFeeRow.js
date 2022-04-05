import lang from 'i18n-js';
import { constant, times } from 'lodash';
import React from 'react';
import useRainbowFee from '../../../hooks/useRainbowFee';

import { FloatingEmojisTapper } from '../../floating-emojis';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useAccountSettings, useStepper } from '@rainbow-me/hooks';

const emojis = [
  ...times(3, constant('rainbow')),
  ...times(2, constant('money_bag')),
];

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
    <FloatingEmojisTapper
      activeScale={1.06}
      disableRainbow
      distance={150}
      duration={1500}
      emojis={emojis}
      onPress={nextStep}
      radiusAndroid={30}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
    >
      <SwapDetailsRow label={lang.t('expanded_state.swap_details.rainbow_fee')}>
        <SwapDetailsValue>{steps[step]}</SwapDetailsValue>
      </SwapDetailsRow>
    </FloatingEmojisTapper>
  );
}
