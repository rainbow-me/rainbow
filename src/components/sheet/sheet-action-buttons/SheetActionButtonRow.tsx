import React, { Children } from 'react';
import styled from 'styled-components';
import { FlexItem, Row } from '../../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  justify: 'space-around',
})`
  ${({ ignorePaddingBottom, ignorePaddingTop, paddingHorizontal }) =>
    padding(
      ignorePaddingTop ? 0 : 19,
      paddingHorizontal || 11.5,
      ignorePaddingBottom ? 0 : 24
    )};
  ${({ paddingBottom }) =>
    paddingBottom ? `padding-bottom: ${paddingBottom};` : ``}
  width: 100%;
  z-index: 2;
  elevation: -1;
`;

function renderButton(child: any) {
  if (!child) return null;
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

export default function SheetActionButtonRow({
  children,
  ignorePaddingBottom,
  ignorePaddingTop,
  paddingBottom = null,
  paddingHorizontal = null,
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      ignorePaddingBottom={ignorePaddingBottom}
      ignorePaddingTop={ignorePaddingTop}
      paddingBottom={paddingBottom}
      paddingHorizontal={paddingHorizontal}
    >
      {Children.map(children, renderButton)}
    </Container>
  );
}
