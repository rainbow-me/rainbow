import createEmojiRegex from 'emoji-regex';
import React, { Fragment, ReactNode } from 'react';
import { Text as NativeText } from 'react-native';

const emojiRegex = createEmojiRegex();
const systemFontStyle = { fontFamily: 'System' } as const;

type StringNode = string | (string | null)[];

export const nodeHasEmoji = (children: ReactNode) =>
  (Array.isArray(children) ? children : [children]).some(
    child => typeof child === 'string' && createEmojiRegex().test(child)
  );

export const nodeIsString = (children: ReactNode): children is StringNode =>
  typeof children === 'string' ||
  (Array.isArray(children) &&
    children.every(child => typeof child === 'string' || child === null));

// Using emoji within a text node in a custom font causes the
// text to render higher than its usual baseline on iOS. To
// fix this, we wrap all emoji in another Text element that
// resets the font family back to "System"
export const renderEmoji = (stringNode: StringNode) => {
  if (__DEV__ && !nodeIsString(stringNode)) {
    throw new Error('renderEmoji: Only string values are supported.');
  }

  const strings = Array.isArray(stringNode) ? stringNode : [stringNode];

  return (
    <Fragment>
      {strings.map(node => {
        if (typeof node !== 'string') {
          return node;
        }

        const string = node;
        const emojis = string.match(emojiRegex);

        if (emojis === null) {
          return string;
        }

        return string.split(emojiRegex).map((stringPart, index) => (
          <Fragment key={index}>
            {stringPart}
            {emojis[index] ? (
              <NativeText style={systemFontStyle}>{emojis[index]}</NativeText>
            ) : null}
          </Fragment>
        ));
      })}
    </Fragment>
  );
};
