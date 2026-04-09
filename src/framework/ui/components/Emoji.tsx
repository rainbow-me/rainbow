import React, { type ReactNode } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import Text from '@/components/text/Text';
import { type TextAlign, type TextLetterSpacing, type TextLineHeight, type TextSize } from '@/components/text/types';
import { resolveEmoji } from '@/framework/core/emoji/resolveEmoji';

interface EmojiProps {
  letterSpacing?: TextLetterSpacing;
  lineHeight?: TextLineHeight;
  size?: TextSize;
  align?: TextAlign;
  name?: string;
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
}

export default function Emoji({
  children = undefined,
  letterSpacing = 'zero',
  lineHeight = 'none',
  name,
  size = 'h4',
  ...props
}: EmojiProps) {
  return (
    <Text {...props} isEmoji letterSpacing={letterSpacing} lineHeight={lineHeight} size={size}>
      {children || resolveEmoji(name)}
    </Text>
  );
}
