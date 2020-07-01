import React from 'react';
import { colors } from '../../../styles';
import { neverRerender } from '../../../utils';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';

const emojis = ['soon', 'soon', 'soon', 'soon', 'unicorn', 'soon', 'rainbow'];

const WithdrawActionButton = ({ color = colors.white, ...props }) => (
  <FloatingEmojis
    distance={350}
    duration={2000}
    emojis={emojis}
    size={36}
    wiggleFactor={0}
  >
    {({ onNewEmoji }) => (
      <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
        <SheetActionButton
          {...props}
          color={color}
          label="􀁏 Withdraw"
          textColor={colors.dark}
        />
      </FloatingEmojisTapHandler>
    )}
  </FloatingEmojis>
);

export default neverRerender(WithdrawActionButton);
