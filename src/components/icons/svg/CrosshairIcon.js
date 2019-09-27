import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const CrosshairIcon = ({ color, ...props }) => (
  <Svg viewBox="0 0 259 259" {...props}>
    <Path
      d="M200.313 1c20.059 0 27.333 2.089 34.666 6.01 7.333 3.922 13.089 9.678 17.01 17.011C255.912 31.354 258 38.628 258 58.687m0 141.626c0 20.059-2.089 27.333-6.01 34.666-3.922 7.333-9.678 13.089-17.011 17.01-7.333 3.922-14.607 6.011-34.666 6.011m-141.626 0c-20.059 0-27.333-2.089-34.666-6.01-7.333-3.922-13.089-9.678-17.01-17.011C3.088 227.646 1 220.372 1 200.313M1 58.687c0-20.059 2.089-27.333 6.01-34.666 3.922-7.333 9.678-13.089 17.011-17.01C31.354 3.088 38.628 1 58.687 1"
      fill="none"
      fillRule="nonzero"
      stroke={color}
      strokeLineCap="round"
      strokeWidth="2"
    />
  </Svg>
);

CrosshairIcon.propTypes = {
  color: PropTypes.string,
};

CrosshairIcon.defaultProps = {
  color: colors.white,
};

export default CrosshairIcon;
