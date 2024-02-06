import React from 'react';
import FloatingEmojis from './FloatingEmojis';
import FloatingEmojisTapHandler from './FloatingEmojisTapHandler';

const emojis = ['soon_arrow', 'soon_arrow', 'soon_arrow', 'soon_arrow', 'unicorn', 'soon_arrow', 'rainbow'];

export default function ComingSoonFloatingEmojis(props) {
  return (
    <FloatingEmojis distance={350} duration={2000} emojis={emojis} size={36} wiggleFactor={0}>
      {({ onNewEmoji }) => <FloatingEmojisTapHandler {...props} onNewEmoji={onNewEmoji} />}
    </FloatingEmojis>
  );
}
