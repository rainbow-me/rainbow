import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const HandleIcon = ({ color, ...props }) => (
  <Svg height="11" width="37" viewBox="0 0 37 11" {...props}>
    <Path
      d="M2.164 5.356A2.5 2.5 0 1 1 3.836.644l14.162 5.025a1.5 1.5 0 0 0 1.004 0L33.164.644a2.5 2.5 0 0 1 1.672 4.712l-14.162 5.025a6.5 6.5 0 0 1-4.348 0L2.164 5.356z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

HandleIcon.propTypes = {
  color: PropTypes.string,
};

HandleIcon.defaultProps = {
  color: colors.black,
};

export default HandleIcon;
