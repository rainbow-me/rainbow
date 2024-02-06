import { isString } from 'lodash';
import React from 'react';
import Text from './Text';
import { emojis } from '@/references';

const emojiData = Object.entries(emojis).map(([emoji, { name }]) => [name, emoji]);

export const emoji = new Map(emojiData);

function normalizeName(name) {
  if (/:.+:/.test(name)) {
    name = name.slice(1, -1);
  }

  return name;
}

function getEmoji(name) {
  return isString(name) ? emoji.get(normalizeName(name)) : null;
}

export default function Emoji({ children = undefined, letterSpacing = 'zero', lineHeight = 'none', name, size = 'h4', ...props }) {
  return (
    <Text {...props} isEmoji letterSpacing={letterSpacing} lineHeight={lineHeight} size={size}>
      {children || getEmoji(name)}
    </Text>
  );
}
