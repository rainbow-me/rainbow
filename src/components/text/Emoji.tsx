import { isString } from 'lodash';
import React from 'react';
import Text from './Text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { emojis } from '@rainbow-me/references';

// @ts-expect-error ts-migrate(2339) FIXME: Property 'name' does not exist on type 'unknown'.
const emojiData = Object.entries(emojis).map(([emoji, { name }]) => [
  name,
  emoji,
]);

// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
const emoji = new Map(emojiData);

function normalizeName(name: any) {
  if (/:.+:/.test(name)) {
    name = name.slice(1, -1);
  }

  return name;
}

function getEmoji(name: any) {
  return isString(name) ? emoji.get(normalizeName(name)) : null;
}

export default function Emoji({
  children,
  letterSpacing = 'zero',
  lineHeight = 'none',
  name,
  size = 'h4',
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Text
      {...props}
      isEmoji
      letterSpacing={letterSpacing}
      lineHeight={lineHeight}
      size={size}
    >
      {children || getEmoji(name)}
    </Text>
  );
}
