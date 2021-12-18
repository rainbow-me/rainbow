import styled from '@terrysahaidak/style-thing';
import React from 'react';
import Text from './Text';

const TruncatedTextComponent = styled(Text).attrs(
  ({ ellipsizeMode = 'tail', numberOfLines = 1, testID }) => ({
    ellipsizeMode,
    numberOfLines,
    testID,
  })
)({});

export default function TruncatedText(props) {
  return (
    <TruncatedTextComponent
      {...props}
      children={props.children === false ? '' : props.children}
    />
  );
}
