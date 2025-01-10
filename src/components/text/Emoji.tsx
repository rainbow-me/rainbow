import { isString } from 'lodash';
import React, { ReactNode } from 'react';
import Text from './Text';
import { emojis } from '@/references';

const emojiData = Object.entries(emojis).map(([emojiChar, { name }]) => {
  return [name, emojiChar];
}) as [string, string][];

export const emoji = new Map<string, string>(emojiData);

function normalizeName(name: string): string {
  if (/:.+:/.test(name)) {
    name = name.slice(1, -1);
  }
  return name;
}

function getEmoji(name: unknown): string | null {
  if (!isString(name)) return null;
  const result = emoji.get(normalizeName(name));
  return result ?? null;
}

export interface TextProps {
  isEmoji?: boolean;
  letterSpacing?: string;
  lineHeight?: string;
  size?: string;
  [key: string]: unknown;
}

export interface EmojiProps extends Omit<TextProps, 'isEmoji' | 'size' | 'lineHeight' | 'letterSpacing' | 'children'> {
  children?: ReactNode;
  letterSpacing?: string;
  lineHeight?: string;
  name?: string;
  size?: string;
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
      {children || getEmoji(name)}
    </Text>
  );
}
