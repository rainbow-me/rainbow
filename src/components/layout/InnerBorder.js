import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { colors, position } from '../../styles';

const InnerBorder = ({ color, opacity, radius, width, ...props }) => (
  <View
    {...props}
    {...position.coverAsObject}
    borderColor={color}
    borderRadius={radius}
    borderWidth={width}
    opacity={opacity}
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

export default React.memo(InnerBorder);
