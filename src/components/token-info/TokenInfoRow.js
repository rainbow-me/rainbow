import React, { Children, cloneElement } from 'react';
import styled from 'styled-components/primitives';
import { FlexItem, Row } from '../layout';
import { padding } from '@rainbow-me/styles';

const space = 9.5;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, space)};
  width: 100%;
`;

function renderChild(child, index) {
  if (!child) return null;

  return (
    <FlexItem key={`TokenInfoRow-${index}`} marginHorizontal={space}>
      {cloneElement(child, {
        align: index === 0 ? 'left' : 'right',
      })}
    </FlexItem>
  );
}

export default function TokenInfoRow({ children, ...props }) {
  return (
    <Container {...props}>
      {Children.toArray(children).map(renderChild)}
    </Container>
  );
}
