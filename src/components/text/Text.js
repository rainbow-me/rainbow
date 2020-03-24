import React from 'react';
import { Text as TextPrimitive } from 'react-primitives';
import { buildTextStyles } from '../../styles';

export default function Text(props) {
  return (
    <TextPrimitive {...props} allowFontScaling={false} css={buildTextStyles} />
  );
}
