import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors, position } from '../styles';

const BorderLine = styled.View`
  ${borders.buildRadius('left', 2)};
  ${position.cover};
  background-color: ${colors.lightGrey};
  left: ${({ insetLeft }) => (insetLeft || 0)};
  right: ${({ insetRight }) => (insetRight || 0)};
`;

const Container = styled(Row)`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: 2;
  width: 100%;
`;

const Divider = ({ insetLeft, insetRight, ...props }) => (
  <Container {...props}>
    <BorderLine
      insetLeft={insetLeft}
      insetRight={insetRight}
    />
  </Container>
);

Divider.propTypes = {
  insetLeft: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  insetRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
};

Divider.defaultProps = {
  insetLeft: 19,
  insetRight: false,
};

export default pure(Divider);
