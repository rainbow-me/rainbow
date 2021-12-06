import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const ShareIcon = ({ color, colors, ...props }) => (
  <Svg height="26" viewBox="0 0 18 26" width="18" {...props}>
    <Path
      d="M18 12.005v10.003a3.004 3.004 0 0 1-3 3.001H3a3.004 3.004 0 0 1-3-3.001V12.005a3.004 3.004 0 0 1 3-3.001h2a1 1 0 0 1 0 2H3c-.552.001-1 .449-1 1v10.004c0 .552.448 1 1 1h12c.552 0 1-.448 1-1V12.005c0-.552-.448-1-1-1h-2a1 1 0 0 1 0-2.001h2a3.004 3.004 0 0 1 3 3zm-9 5.003a1 1 0 0 1-1-1V6.013H5.503a.514.514 0 0 1-.41-.811L8.588.215a.498.498 0 0 1 .819 0L12.9 5.202a.514.514 0 0 1-.41.811H10v9.995a1 1 0 0 1-1 1z"
      fill={color || colors.white}
      fillRule="nonzero"
    />
  </Svg>
);

ShareIcon.propTypes = {
  color: PropTypes.string,
};

export default ShareIcon;
