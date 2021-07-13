import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const CheckmarkCircledIcon = ({ color, colors, ...props }) => (
  <Svg height="22" viewBox="0 0 22 22" width="22" {...props}>
    <Path
      d="M11 22C17.0316 22 22 17.034 22 11.0053C22 4.97657 17.0211 0 11 0C4.96842 0 0 4.97657 0 11.0053C0 17.034 4.96842 22 11 22Z"
      fill={color || colors.black}
    />
    <Path
      d="M8.4843 16.0134C8.80009 16.3816 9.14746 16.5815 9.57904 16.5815C10.0001 16.5815 10.379 16.3711 10.6422 15.9818L15.979 7.75418C16.1369 7.50167 16.2633 7.21759 16.2633 6.96508C16.2633 6.35485 15.7159 5.94452 15.1369 5.94452C14.7685 5.94452 14.4422 6.14442 14.1896 6.55475L9.54746 13.9407L7.13693 10.9526C6.86325 10.6265 6.57904 10.4792 6.22115 10.4792C5.63167 10.4792 5.14746 10.9526 5.14746 11.5629C5.14746 11.847 5.2422 12.1205 5.46325 12.373L8.4843 16.0134Z"
      fill={colors.whiteLabel}
    />
  </Svg>
);

CheckmarkCircledIcon.propTypes = {
  color: PropTypes.string,
};

export default CheckmarkCircledIcon;
