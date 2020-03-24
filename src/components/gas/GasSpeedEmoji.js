import { has } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import { gasUtils } from '../../utils';
import { Emoji } from '../text';
import { GasSpeedLabelPagerItemHeight } from './GasSpeedLabelPagerItem';

const EmojiForGasSpeedType = {
  [gasUtils.FAST]: {
    emoji: 'rocket', // 🚀️
    position: [-1, 0], // (x, y)
  },
  [gasUtils.NORMAL]: {
    emoji: 'stopwatch', // ⏱️
    position: [-0.5, -1], // (x, y)
  },
  [gasUtils.SLOW]: {
    emoji: 'snail', // 🐌️
    position: [-1, -2], // (x, y)
  },
};

const GasSpeedEmoji = ({ label }) => {
  const gasSpeed = has(EmojiForGasSpeedType, label)
    ? EmojiForGasSpeedType[label]
    : EmojiForGasSpeedType[gasUtils.NORMAL];

  return (
    <View height={GasSpeedLabelPagerItemHeight} width={25}>
      <Emoji
        lineHeight="looser"
        name={gasSpeed.emoji}
        size="lmedium"
        style={{
          left: gasSpeed.position[0],
          position: 'absolute',
          top: gasSpeed.position[1],
        }}
      />
    </View>
  );
};

GasSpeedEmoji.propTypes = {
  label: PropTypes.oneOf(gasUtils.GasSpeedOrder),
};

export default onlyUpdateForKeys(['label'])(GasSpeedEmoji);
