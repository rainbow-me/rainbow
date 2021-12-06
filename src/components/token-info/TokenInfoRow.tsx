import React, { Children, cloneElement } from 'react';
import styled from 'styled-components';
import { FlexItem, Row } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const space = 9.5;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, space)};
  width: 100%;
`;

function renderChild(child: any, index: any) {
  if (!child) return null;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlexItem key={`TokenInfoRow-${index}`} marginHorizontal={space}>
      {cloneElement(child, {
        align: index === 0 ? 'left' : 'right',
      })}
    </FlexItem>
  );
}

export default function TokenInfoRow({ children, ...props }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props}>
      {Children.toArray(children).map(renderChild)}
    </Container>
  );
}
