import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const WarningIcon = ({ color, ...props }) => (
  <Svg height="16" width="16" viewBox="0 0 16 16" {...props}>
    <Path
      d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zm-.003-3.333a1.014 1.014 0 1 0 0-2.028 1.014 1.014 0 0 0 0 2.028zM8.673 3.2H7.327a.342.342 0 0 0-.345.356l.31 5.748a.342.342 0 0 0 .345.32h.726a.343.343 0 0 0 .346-.32l.309-5.748a.342.342 0 0 0-.345-.356z"
      fill={color}
      fillRule="evenodd"
    />
  </Svg>
);
/* eslint-disable max-len */

WarningIcon.propTypes = {
  color: PropTypes.string,
};

WarningIcon.defaultProps = {
  color: colors.black,
};

export default WarningIcon;
