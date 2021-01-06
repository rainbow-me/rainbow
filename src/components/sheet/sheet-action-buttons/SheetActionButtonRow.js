import React, { Children } from 'react';
import styled from 'styled-components/primitives';
import { FlexItem, Row } from '../../layout';
import { padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  justify: 'space-around',
})`
  ${({ ignorePaddingBottom, ignorePaddingTop }) =>
    padding(ignorePaddingTop ? 0 : 19, 11.5, ignorePaddingBottom ? 0 : 24)};
  width: 100%;
  z-index: 2;
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
}) {
  return (
    <Container
      ignorePaddingBottom={ignorePaddingBottom}
      ignorePaddingTop={ignorePaddingTop}
    >
      {Children.map(children, renderButton)}
    </Container>
  );
}
