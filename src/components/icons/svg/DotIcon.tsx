import PropTypes from 'prop-types';
import React from 'react';
import { Circle } from 'react-native-svg';
import Svg from '../Svg';

const DotIcon = ({ color, colors, ...props }) => (
  <Svg height="7" viewBox="0 0 7 7" width="7" {...props}>
    <Circle cx="3.5" cy="3.5" fill={color || colors.black} r="3.5" />
  </Svg>
);

DotIcon.propTypes = {
  color: PropTypes.string,
};

export default DotIcon;
