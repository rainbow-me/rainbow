import { has } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import { gasUtils } from '../../utils';
import { Emoji } from '../text';

const EmojiForGasSpeedType = {
  fast: {
    emoji: 'rocket', // 🚀️
    position: [1, 2], // x: 1, y: 2
  },
  normal: {
    emoji: 'stopwatch', // ⏱️
    position: [2, 1], // x: 2, y: 1
  },
  slow: {
    emoji: 'snail', // 🐌️
    position: [1, 0], // x: 1, y: 0
  },
};

const GasSpeedEmoji = ({ label }) => {
  const gasSpeed = has(EmojiForGasSpeedType, label)
    ? EmojiForGasSpeedType[label]
    : EmojiForGasSpeedType.normal;

  return (
    <View height={28} width={25}>
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
  label: PropTypes.oneOf(gasUtils.GasSpeedTypes),
};

export default onlyUpdateForKeys(['label'])(GasSpeedEmoji);
