import PropTypes from 'prop-types';
import React from 'react';
import { Column } from '../layout';
import styled from '@rainbow-me/styled-components';
import { shadow } from '@rainbow-me/styles';

const FloatingPanelBorderRadius = 18;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const FloatingPanelShadow = colors =>
  shadow.buildAsObject(0, 10, 50, colors.shadow, 0.6);

const Container = styled(Column)(
  ({
    hideShadow,
    color,
    theme: { colors },
    radius,
    minHeight,
    overflow,
    translateY = 0,
  }) => ({
    ...(hideShadow ? {} : FloatingPanelShadow(colors)),

    backgroundColor: color,
    borderRadius: radius,
    minHeight: minHeight || 0,
    opacity: 1,
    overflow,
    transform: [{ translateY }],
    zIndex: 1,
  })
);

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
