import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { onlyUpdateForPropTypes } from 'recompact';
import { colors, position } from '../styles';

const InnerBorder = ({
  color,
  opacity,
  radius,
  width,
  ...props
}) => (
  <View
    {...props}
    css={`
      ${position.cover}
      border-color: ${color};
      border-radius: ${radius};
      border-width: ${width};
      opacity: ${opacity};
    `}
    pointerEvents="none"
  />
);

InnerBorder.propTypes = {
  color: PropTypes.string,
  opacity: PropTypes.number,
  radius: PropTypes.number,
  width: PropTypes.number,
};

InnerBorder.defaultProps = {
  color: colors.black,
  opacity: 0.06,
  radius: 0,
  width: 0.5,
};

export default onlyUpdateForPropTypes(InnerBorder);
