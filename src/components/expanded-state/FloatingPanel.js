import PropTypes from 'prop-types';
import React from 'react';
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
  overflow: hidden;
  padding-bottom: 0px;
  width: 100%;
  z-index: 1;
`;

const FloatingPanel = ({ children, color, ...props }) => (
  <Container {...props} color={color}>
    {children}
  </Container>
);

FloatingPanel.propTypes = {
  children: PropTypes.node,
  color: PropTypes.string,
};

FloatingPanel.defaultProps = {
  color: colors.white,
};

FloatingPanel.padding = FloatingPanelPadding;

export default FloatingPanel;
