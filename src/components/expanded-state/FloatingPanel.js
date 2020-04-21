import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import stylePropType from 'react-style-proptype';
import { colors, shadow } from '../../styles';
import { Column } from '../layout';

const FloatingPanelBorderRadius = 16;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const sx = StyleSheet.create({
  container: {
    opacity: 1,
    paddingBottom: 0,
    zIndex: 1,
  },
  shadow: shadow.buildAsObject(0, 10, 50, colors.dark, 0.6),
});

const FloatingPanel = ({
  color,
  height,
  hideShadow,
  overflow,
  radius,
  style,
  ...props
}) => (
  <Column
    backgroundColor={color}
    borderRadius={radius || FloatingPanelBorderRadius}
    minHeight={height || 'auto'}
    overflow={overflow || 'hidden'}
    style={[sx.container, hideShadow ? null : sx.shadow, style]}
    {...props}
  />
);

FloatingPanel.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  hideShadow: PropTypes.bool,
  overflow: PropTypes.string,
  radius: PropTypes.number,
  style: stylePropType,
  width: PropTypes.number,
};

FloatingPanel.defaultProps = {
  color: colors.white,
  hideShadow: true,
};

FloatingPanel.padding = FloatingPanelPadding;
FloatingPanel.borderRadius = FloatingPanelBorderRadius;

export default FloatingPanel;
