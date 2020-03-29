import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import { pure } from 'recompact';
import { colors, shadow } from '../../styles';
import { Column } from '../layout';

const FloatingPanelBorderRadius = 16;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const FloatingPanel = pure(
  ({ color, height, hideShadow, style, radius, overflow, ...props }) => (
    <Column
      css={`
      ${shadow.build(0, 10, 50, colors.dark, hideShadow ? 0 : 0.6)}
      background-color: ${color};
      border-radius: ${radius || FloatingPanelBorderRadius};
      min-height: ${height || 'auto'};
      opacity: 1;
      overflow: ${overflow || 'hidden'};
      padding-bottom: 0px;
      z-index: 1;
    `}
      style={style}
      {...props}
    />
  )
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
