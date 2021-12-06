import React from 'react';
import styled from 'styled-components';
import Text from './Text';

const TruncatedTextComponent = styled(Text).attrs(
  ({ ellipsizeMode = 'tail', numberOfLines = 1, testID }) => ({
    ellipsizeMode,
    numberOfLines,
    testID,
  })
)``;

export default function TruncatedText(props: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TruncatedTextComponent
      {...props}
      children={props.children === false ? '' : props.children}
    />
  );
}
