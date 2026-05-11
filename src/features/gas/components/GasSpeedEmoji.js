import React from 'react';
import { Platform } from 'react-native';

import { Emoji } from '@/components/text';
import styled from '@/framework/ui/styled-thing';
import { margin } from '@/styles';
import magicMemo from '@/utils/magicMemo';

import gasUtils from '../utils/gas';

const EmojiForGasSpeedType = {
  [gasUtils.URGENT]: {
    emoji: 'police_car_light',
    // 🚨
    top: Platform.OS === 'android' ? -2 : -0.5,
  },
  [gasUtils.FAST]: {
    emoji: 'rocket',
    // 🚀️
    top: Platform.OS === 'android' ? -1.25 : -1.25,
  },
  [gasUtils.NORMAL]: {
    emoji: Platform.OS === 'ios' ? 'stopwatch' : 'nine_o_clock',
    // ⏱️ 🕘
    top: Platform.OS === 'android' ? 0 : -1.25,
  },
  [gasUtils.SLOW]: {
    emoji: 'snail',
    // 🐌️
    top: Platform.OS === 'android' ? 0 : -1,
  },
  [gasUtils.CUSTOM]: {
    emoji: 'gear',
    // ⚙️
    top: Platform.OS === 'android' ? -0.5 : -0.5,
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
