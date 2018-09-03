import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const CameraIcon = ({ color, ...props }) => (
  <Svg height="21" width="26" viewBox="0 0 26 21" {...props}>
    <Path
      d="M22.395 3.36c1.966 0 3.578 1.61 3.605 3.55v10.269a3.59 3.59 0 0 1-3.578 3.577H3.605c-1.966 0-3.578-1.611-3.605-3.55V6.937a3.59 3.59 0 0 1 3.578-3.578H5.27c.328 0 .655-.19.847-.464L7.592.71C7.866.3 8.521 0 9.095 0h7.674c.573 0 1.229.3 1.502.71l1.475 2.185c.191.3.491.464.846.464h1.803zM13 17.44a6.238 6.238 0 0 0 6.24-6.24A6.238 6.238 0 0 0 13 4.96a6.238 6.238 0 0 0-6.24 6.24A6.238 6.238 0 0 0 13 17.44zm9.272-8.937c.682 0 1.229-.546 1.201-1.201 0-.656-.546-1.202-1.201-1.202-.656 0-1.202.546-1.202 1.202 0 .655.546 1.201 1.202 1.201zM13 15.6a4.4 4.4 0 1 1 0-8.8 4.4 4.4 0 0 1 0 8.8z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CameraIcon.propTypes = {
  color: PropTypes.string,
};

CameraIcon.defaultProps = {
  color: colors.black,
};

export default CameraIcon;
