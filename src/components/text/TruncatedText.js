import React from 'react';
import Text from './Text';
import styled from '@rainbow-me/styled-components';

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
