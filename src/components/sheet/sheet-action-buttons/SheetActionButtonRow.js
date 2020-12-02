import React, { Children } from 'react';
import styled from 'styled-components/primitives';
import { FlexItem, Row } from '../../layout';
import { padding } from '@rainbow-me/styles';

const Container = styled(Row)`
  ${padding(19, 11.5, 24)}
  width: 100%;
  z-index: 2;
  justify-content: space-around;
`;

function renderButton(child) {
  if (android) {
    return child;
  }
  if (!child) return null;
  return <FlexItem marginHorizontal={7.5}>{child}</FlexItem>;
}

export default function SheetActionButtonRow({ children }) {
  return (
    <Container isSingleChildren={children.length === 1}>
      {Children.map(children, renderButton)}
    </Container>
  );
}
