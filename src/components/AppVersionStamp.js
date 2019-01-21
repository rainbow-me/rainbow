import React from 'react';
import styled from 'styled-components/primitives';
import { Monospace } from './text';
import { colors } from '../styles';

const Container = styled(Monospace).attrs({
  size: 'h5',
  weight: 'medium',
})`
  color: ${({ color }) => (color || colors.grey)};
  flex-shrink: 0;
  line-height: 28;
  margin-bottom: 21;
  text-align: center;
`;

const AppVersionStamp = props => <Container {...props}>Balance v0.3.0 (10)</Container>;

export default AppVersionStamp;
