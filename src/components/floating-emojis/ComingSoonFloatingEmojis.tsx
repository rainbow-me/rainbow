import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmojis' was resolved to '/Users/... Remove this comment to see the full error message
import FloatingEmojis from './FloatingEmojis';
// @ts-expect-error ts-migrate(6142) FIXME: Module './FloatingEmojisTapHandler' was resolved t... Remove this comment to see the full error message
import FloatingEmojisTapHandler from './FloatingEmojisTapHandler';

const emojis = [
  'soon_arrow',
  'soon_arrow',
  'soon_arrow',
  'soon_arrow',
  'unicorn',
  'soon_arrow',
  'rainbow',
];

export default function ComingSoonFloatingEmojis(props: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FloatingEmojis
      distance={350}
      duration={2000}
      emojis={emojis}
      size={36}
      wiggleFactor={0}
    >
      {({ onNewEmoji }: any) => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FloatingEmojisTapHandler {...props} onNewEmoji={onNewEmoji} />
      )}
    </FloatingEmojis>
  );
}
