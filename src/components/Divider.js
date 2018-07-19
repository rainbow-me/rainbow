import React from 'react';
import styled from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors } from '../styles';

const BorderLine = styled.View`
  ${borders.buildRadius('left', 2)}
  background-color: ${colors.lightGrey};
  bottom: 0;
  left: 19;
  position: absolute;
  right: 0;
  top: 0;
`;

const Container = styled(Row)`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: 2;
  width: 100%;
`;

const Divider = props => (
  <Container {...props}>
    <BorderLine />
  </Container>
);

export default Divider;
