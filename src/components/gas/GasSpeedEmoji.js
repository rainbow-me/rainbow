import { has } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { gasUtils, magicMemo } from '../../utils';
import { Emoji } from '../text';

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

const Container = styled.View`
  height: ${({ height }) => height};
  width: 25;
`;

const GasEmoji = styled(Emoji).attrs({
  lineHeight: 'looser',
  size: 'lmedium',
})`
  left: ${({ left }) => left};
  position: absolute;
  top: ${({ top }) => top};
`;

const GasSpeedEmoji = ({ containerHeight, label }) => {
  const gasSpeed = has(EmojiForGasSpeedType, label)
    ? EmojiForGasSpeedType[label]
    : EmojiForGasSpeedType[gasUtils.NORMAL];

  return (
    <Container height={containerHeight}>
      <GasEmoji
        left={gasSpeed.position[0]}
        name={gasSpeed.emoji}
        top={gasSpeed.position[1]}
      />
    </Container>
  );
};

export default magicMemo(GasSpeedEmoji, 'label');
