import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

/* eslint-disable max-len */
const CopyIcon = ({ color, ...props }) => (
  <Svg height="16" width="17" viewBox="0 0 16 17" {...props}>
    <Path
      d="M7.273.5h6.545c.602 0 1.117.213 1.543.64.426.425.639.94.639 1.542v6.545c0 .603-.213 1.117-.64 1.543-.425.426-.94.64-1.542.64H10.91v2.908c0 .602-.213 1.117-.639 1.543-.426.426-.94.639-1.543.639H2.182a2.102 2.102 0 0 1-1.543-.64A2.102 2.102 0 0 1 0 14.319V7.773C0 7.17.213 6.656.64 6.23c.425-.426.94-.64 1.542-.64H5.09V2.683c0-.602.213-1.117.639-1.543C6.156.713 6.67.5 7.273.5zM5.09 9.227V7.046H2.18a.7.7 0 0 0-.513.212.7.7 0 0 0-.213.515v6.545a.7.7 0 0 0 .213.514.7.7 0 0 0 .514.213h6.545a.7.7 0 0 0 .515-.213.7.7 0 0 0 .212-.514V11.41H7.273a2.102 2.102 0 0 1-1.543-.639 2.102 2.102 0 0 1-.64-1.543zm8.727-7.272H7.273a.7.7 0 0 0-.515.213.7.7 0 0 0-.212.514v6.545a.7.7 0 0 0 .212.515.7.7 0 0 0 .515.212h6.545a.7.7 0 0 0 .514-.212.7.7 0 0 0 .213-.515V2.682a.7.7 0 0 0-.213-.514.7.7 0 0 0-.514-.213z"
      fillRule="nonzero"
      fill={color}
    />
  </Svg>
);
/* eslint-disable max-len */

CopyIcon.propTypes = {
  color: PropTypes.string,
};

CopyIcon.defaultProps = {
  color: colors.black,
};

export default CopyIcon;
