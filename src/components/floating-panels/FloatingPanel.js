import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, shadow } from '../../styles';
import { Column } from '../layout';

const FloatingPanelBorderRadius = 18;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const FloatingPanelShadow = shadow.build(0, 10, 50, colors.dark, 0.6);

const Container = styled(Column)`
  ${({ hideShadow }) => (hideShadow ? '' : FloatingPanelShadow)};
  background-color: ${({ color }) => color};
  border-radius: ${({ radius }) => radius};
  min-height: ${({ minHeight }) => minHeight || 0};
  opacity: 1;
  overflow: ${({ overflow }) => overflow};
  z-index: 1;
`;

const FloatingPanel = ({
  color = colors.white,
  height = 'auto',
  hideShadow = true,
  overflow = 'hidden',
  radius = FloatingPanelBorderRadius,
  ...props
}) => (
  <Container
    {...props}
    color={color}
    hideShadow={hideShadow}
    minHeight={height}
    overflow={overflow}
    radius={radius}
  />
);

FloatingPanel.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  hideShadow: PropTypes.bool,
  overflow: PropTypes.string,
  radius: PropTypes.number,
  width: PropTypes.number,
};

FloatingPanel.padding = FloatingPanelPadding;
FloatingPanel.borderRadius = FloatingPanelBorderRadius;

export default FloatingPanel;
