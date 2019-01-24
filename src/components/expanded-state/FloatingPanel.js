import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { Column } from '../layout';

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const Container = styled(Column)`
  background-color: ${({ color }) => color};
  border-radius: 12;
  min-height: ${({ size }) => size || 'auto'};
  padding-bottom: 0px;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 10px;
  shadow-opacity: 0.4;
  shadow-radius: 50;
  width: 100%;
  z-index: 1;
`;

const FloatingPanel = pure(({ children, color, ...props }) => (
  <Container {...props} color={color}>
    {children}
  </Container>
));

FloatingPanel.propTypes = {
  children: PropTypes.node,
  color: PropTypes.string,
};

FloatingPanel.defaultProps = {
  color: colors.white,
};

FloatingPanel.padding = FloatingPanelPadding;

export default FloatingPanel;
