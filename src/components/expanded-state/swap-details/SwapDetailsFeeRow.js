import lang from 'i18n-js';
import { constant, times } from 'lodash';
import React from 'react';

import { FloatingEmojisTapper } from '../../floating-emojis';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';

const emojis = [
  ...times(3, constant('rainbow')),
  ...times(2, constant('money_bag')),
];

export default function SwapDetailsUniswapRow({ fee }) {
  return (
    <FloatingEmojisTapper
      activeScale={1.06}
      disableRainbow
      distance={150}
      duration={1500}
      emojis={emojis}
      radiusAndroid={30}
      scaleTo={0}
      size={50}
      wiggleFactor={0}
    >
      <SwapDetailsRow label={lang.t('expanded_state.swap_details.rainbow_fee')}>
        <SwapDetailsValue>{fee}</SwapDetailsValue>
      </SwapDetailsRow>
    </FloatingEmojisTapper>
  );
}
