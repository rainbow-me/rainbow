import React from 'react';
import { Emoji } from '../text';
import styled from '@/styled-thing';
import { margin } from '@/styles';
import { gasUtils, magicMemo } from '@/utils';

const EmojiForGasSpeedType = {
  [gasUtils.URGENT]: {
    emoji: 'police_car_light',
    // 🚨
    top: android ? -2 : -0.5,
  },
  [gasUtils.FAST]: {
    emoji: 'rocket',
    // 🚀️
    top: android ? -1.25 : -1.25,
  },
  [gasUtils.NORMAL]: {
    emoji: ios ? 'stopwatch' : 'nine_o_clock',
    // ⏱️ 🕘
    top: -1.25,
  },
  [gasUtils.SLOW]: {
    emoji: 'snail',
    // 🐌️
    top: android ? 0 : -1,
  },
  [gasUtils.CUSTOM]: {
    emoji: 'gear',
    // ⚙️
    top: android ? -0.5 : -0.5,
  },
};

const GasEmoji = styled(Emoji).attrs({
  align: 'center',
  lineHeight: 'looserLoose',
  size: 'smedium',
})(({ top }) => margin.object(top, 0, 0, 0));

const GasSpeedEmoji = ({ label }) => {
  const gasSpeed = EmojiForGasSpeedType[label] || EmojiForGasSpeedType[gasUtils.NORMAL];

  return <GasEmoji name={gasSpeed.emoji} top={gasSpeed.top} />;
};

export default magicMemo(GasSpeedEmoji, 'label');
