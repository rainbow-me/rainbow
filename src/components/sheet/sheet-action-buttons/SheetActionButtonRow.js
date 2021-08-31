import React, { Children } from 'react';
import styled from 'styled-components';
import { FlexItem, Row } from '../../layout';
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

function renderButton(child) {
  if (android) {
    return child;
  }
  if (!child) return null;
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

export default function SheetActionButtonRow({
  children,
  ignorePaddingBottom,
  ignorePaddingTop,
  paddingBottom = null,
  paddingHorizontal = null,
}) {
  return (
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
