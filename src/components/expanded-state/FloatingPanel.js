import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import {
  compose,
  hoistStatics,
  pure,
  setStatic,
} from 'recompact';
import { Column } from '../layout';
import { colors, shadow } from '../../styles';

const FloatingPanelBorderRadius = 12;

export const FloatingPanelPadding = {
  x: 19,
  y: 0,
};

const FloatingPanel = ({
  color,
  height,
  hideShadow,
  style,
  ...props
}) => (
  <Column
    css={`
      ${shadow.build(0, 10, 50, colors.dark, 0.4)}
      background-color: ${color};
      border-radius: ${FloatingPanelBorderRadius};
      min-height: ${height || 'auto'};
      opacity: 1;
      overflow: hidden;
      padding-bottom: 0px;
      width: 100%;
      z-index: 1;
    `}
    style={hideShadow ? {} : style}
    {...props}
  />
);

FloatingPanel.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  hideShadow: PropTypes.bool,
  style: stylePropType,
  width: PropTypes.number,
};

FloatingPanel.defaultProps = {
  color: colors.white,
};

FloatingPanel.padding = FloatingPanelPadding;
FloatingPanel.borderRadius = FloatingPanelBorderRadius;

const enhance = compose(
  pure,
  setStatic({ padding: FloatingPanel.padding }),
);

export default hoistStatics(enhance)(FloatingPanel);
