import { has } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Emoji } from '../text';
import { margin } from '@rainbow-me/styles';
import { gasUtils, magicMemo } from '@rainbow-me/utils';

const EmojiForGasSpeedType = {
  [gasUtils.URGENT]: {
    emoji: 'police_car_light', // 🚨
  },
  [gasUtils.FAST]: {
    emoji: 'rocket', // 🚀️
  },
  [gasUtils.NORMAL]: {
    emoji: 'stopwatch', // ⏱️
  },
  [gasUtils.SLOW]: {
    emoji: 'snail', // 🐌️
  },
  [gasUtils.CUSTOM]: {
    emoji: 'gear', // ⚙️
  },
};

const GasEmoji = styled(Emoji).attrs({
  size: 'lmedium',
})`
  ${margin(android ? 3 : 0, 0, 0, 0)}
`;

const GasSpeedEmoji = ({ label }) => {
  const gasSpeed = has(EmojiForGasSpeedType, label)
    ? EmojiForGasSpeedType[label]
    : EmojiForGasSpeedType[gasUtils.NORMAL];

  return <GasEmoji name={gasSpeed.emoji} />;
};

export default magicMemo(GasSpeedEmoji, 'label');
