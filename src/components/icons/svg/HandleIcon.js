import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const HandleIcon = ({ color, colors, ...props }) => (
  <Svg height="11" viewBox="0 0 37 11" width="37" {...props}>
    <Path
      d="M2.164 5.356A2.5 2.5 0 1 1 3.836.644l14.162 5.025a1.5 1.5 0 0 0 1.004 0L33.164.644a2.5 2.5 0 0 1 1.672 4.712l-14.162 5.025a6.5 6.5 0 0 1-4.348 0L2.164 5.356z"
      fill={color || colors.black}
      fillRule="nonzero"
    />
  </Svg>
);

HandleIcon.propTypes = {
  color: PropTypes.string,
};

export default HandleIcon;
