import React from 'react';
import Text from './Text';
import styled from '@/styled-thing';

const TruncatedTextComponent = styled(Text).attrs(({ ellipsizeMode = 'tail', numberOfLines = 1, testID }) => ({
  ellipsizeMode,
  numberOfLines,
  testID,
}))({});

export default function TruncatedText(props) {
  return (
    <TruncatedTextComponent
      {...props}
      // eslint-disable-next-line react/no-children-prop
      children={props.children === false ? '' : props.children}
    />
  );
}
