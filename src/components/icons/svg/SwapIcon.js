import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'svgs';
import { colors } from '../../../styles';

/* eslint-disable max-len */
const SwapIcon = ({ color, ...props }) => (
  <Svg height="21" width="26" viewBox="0 0 26 21" {...props}>
    <Path
      d="M7.015 15.812c.825 0 1.18.863.673 1.498l-2.336 2.996c-.61.787-1.371.787-1.98 0L1.034 17.31c-.508-.635-.152-1.498.673-1.498h1.524V6.291c0-3.682 2.26-6.018 5.433-6.018 3.161 0 5.472 2.336 5.472 6.018v8.696c0 2.209 1.37 3.567 3.199 3.567 1.84 0 3.174-1.384 3.174-3.567V5.275h-1.524c-.825 0-1.18-.85-.685-1.498L20.637.78c.622-.775 1.37-.775 1.993 0l2.336 2.996c.508.647.152 1.498-.673 1.498H22.77v9.534c0 3.682-2.26 6.018-5.434 6.018-3.161 0-5.472-2.336-5.472-6.018V6.113c0-2.222-1.37-3.58-3.199-3.58-1.84 0-3.174 1.384-3.174 3.58v9.7h1.524z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);
/* eslint-disable max-len */

SwapIcon.propTypes = {
  color: PropTypes.string,
};

SwapIcon.defaultProps = {
  color: colors.white,
};

export default SwapIcon;
