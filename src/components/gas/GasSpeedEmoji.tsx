import { has } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Emoji } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { gasUtils, magicMemo } from '@rainbow-me/utils';

const EmojiForGasSpeedType = {
  [gasUtils.URGENT]: {
    emoji: 'police_car_light',
    // 🚨
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    top: android ? 0 : -0.5,
  },
  [gasUtils.FAST]: {
    emoji: 'rocket',
    // 🚀️
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    top: android ? 0 : -0.5,
  },
  [gasUtils.NORMAL]: {
    emoji: 'stopwatch',
    // ⏱️
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    top: android ? -2 : -1,
  },
  [gasUtils.SLOW]: {
    emoji: 'snail',
    // 🐌️
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    top: android ? 0 : -1,
  },
  [gasUtils.CUSTOM]: {
    emoji: 'gear',
    // ⚙️
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    top: android ? -2 : -0.5,
  },
};

const GasEmoji = styled(Emoji).attrs({
  lineHeight: 'looserLoose',
  size: 'lmedium',
})`
  ${({ top }) => margin(top, 0, 0, 0)}
`;

const GasSpeedEmoji = ({ label }: any) => {
  const gasSpeed = has(EmojiForGasSpeedType, label)
    ? EmojiForGasSpeedType[label]
    : EmojiForGasSpeedType[gasUtils.NORMAL];

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <GasEmoji name={gasSpeed.emoji} top={gasSpeed.top} />;
};

export default magicMemo(GasSpeedEmoji, 'label');
