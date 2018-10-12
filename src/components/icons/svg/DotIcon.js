import PropTypes from 'prop-types';
import React from 'react';
import { Circle } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const DotIcon = ({ color, ...props }) => (
  <Svg height="7" width="7" viewBox="0 0 7 7" {...props}>
    <Circle
      cx="3.5"
      cy="3.5"
      r="3.5"
      fill={color}
    />
  </Svg>
);

DotIcon.propTypes = {
  color: PropTypes.string,
};

DotIcon.defaultProps = {
  color: colors.black,
};

export default DotIcon;
