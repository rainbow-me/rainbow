import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const LockIcon = ({ color, ...props }) => (
  <Svg height="14" width="10" {...props}>
    <Path
      d="M4.602 0c1.854 0 3.6 1.301 3.6 4.043v1.65c.672.102.996.553.996 1.385v4.92c0 .977-.438 1.42-1.34 1.42H1.34c-.895 0-1.339-.443-1.339-1.42V7.083c0-.832.33-1.27.997-1.377V4.043C.997 1.301 2.749 0 4.602 0zm0 1.377c-1.187 0-2.17.864-2.17 2.559v1.739l4.34-.007V3.936c0-1.695-.99-2.559-2.17-2.559z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

LockIcon.propTypes = {
  color: PropTypes.string,
};

LockIcon.defaultProps = {
  color: colors.black,
};

export default LockIcon;
