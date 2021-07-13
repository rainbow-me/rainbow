import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { Column } from '../layout';
import { shadow } from '@rainbow-me/styles';

const FloatingPanelBorderRadius = 18;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const FloatingPanelShadow = colors =>
  shadow.build(0, 10, 50, colors.shadow, 0.6);

const Container = styled(Column)`
  ${({ hideShadow, theme: { colors } }) =>
    hideShadow ? '' : FloatingPanelShadow(colors)};
  background-color: ${({ color }) => color};
  border-radius: ${({ radius }) => radius};
  min-height: ${({ minHeight }) => minHeight || 0};
  opacity: 1;
  overflow: ${({ overflow }) => overflow};
  z-index: 1;
`;

const FloatingPanel = ({
  color,
  height = 'auto',
  hideShadow = true,
  overflow = 'hidden',
  radius = FloatingPanelBorderRadius,
  testID,
  ...props
}) => {
  const { colors } = useTheme();
  return (
    <Container
      {...props}
      color={color || colors.white}
      hideShadow={hideShadow}
      minHeight={height}
      overflow={overflow}
      radius={radius}
      testID={testID + '-container'}
    />
  );
};

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
