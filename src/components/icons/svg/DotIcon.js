import PropTypes from 'prop-types';
import React from 'react';
import { Circle } from 'react-native-svg';
import Svg from '../Svg';
import { colors } from '@rainbow-me/styles';

const DotIcon = ({ color, ...props }) => (
  <Svg height="7" viewBox="0 0 7 7" width="7" {...props}>
    <Circle cx="3.5" cy="3.5" fill={color} r="3.5" />
  </Svg>
);

DotIcon.propTypes = {
  color: PropTypes.string,
};

DotIcon.defaultProps = {
  color: colors.black,
};

export default DotIcon;
