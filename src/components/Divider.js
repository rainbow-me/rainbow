import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors, position } from '../styles';

const BorderLine = styled.View`
  ${borders.buildRadius('left', 2)};
  ${position.cover};
  background-color: ${colors.lightGrey};
  left: 19;
`;

const Container = styled(Row)`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: 2;
  width: 100%;
`;

const Divider = () => (
  <Container>
    <BorderLine />
  </Container>
);

export default pure(Divider);
