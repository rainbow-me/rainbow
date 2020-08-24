import nodeEmoji from 'node-emoji';
import React from 'react';
import Text from './Text';

export default function Emoji({
  children,
  lineHeight = 'none',
  name,
  size = 'h4',
  ...props
}) {
  return (
    <Text {...props} isEmoji lineHeight={lineHeight} size={size}>
      {children || nodeEmoji.get(name)}
    </Text>
  );
}
