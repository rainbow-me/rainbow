import React, { type ReactNode } from 'react';
import Text from '@/components/text/Text';
import { resolveEmoji } from '@/features/emoji/utils/resolveEmoji';
import { type TextAlign, type TextLetterSpacing, type TextSize, type TextLineHeight } from '@/components/text/types';
import { type TextStyle, type StyleProp } from 'react-native';
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
