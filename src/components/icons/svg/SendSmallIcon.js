import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const SendSmallIcon = ({ color, ...props }) => (
  <Svg height="10" width="10" viewBox="0 0 10 10" {...props}>
    <Path
      d="M9.865 9.07c.329.658.035 1.058-.657.892L6.466 9.28c-.346-.083-.662-.443-.703-.816L5.31 4.321c-.12-1.101-.497-1.105-.616 0l-.443 4.143c-.04.368-.357.733-.703.816l-2.752.682c-.693.166-.992-.228-.66-.893L4.405.497c.328-.66.858-.665 1.19 0l4.27 8.572z"
      fillRule="nonzero"
      fill={color}
    />
  </Svg>
);
/* eslint-disable max-len */

SendSmallIcon.propTypes = {
  color: PropTypes.string,
};

SendSmallIcon.defaultProps = {
  color: colors.black,
};

export default SendSmallIcon;
