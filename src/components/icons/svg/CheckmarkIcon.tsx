import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const CheckmarkIcon = ({ color, colors, ...props }) => (
  <Svg height="19" viewBox="0 0 18 18" width="19" {...props}>
    <Path
      d="M3.4843 11.0134C3.80009 11.3816 4.14746 11.5815 4.57904 11.5815C5.00009 11.5815 5.37904 11.3711 5.6422 10.9818L10.979 2.75418C11.1369 2.50167 11.2633 2.21759 11.2633 1.96508C11.2633 1.35485 10.7159 0.944519 10.1369 0.944519C9.76851 0.944519 9.4422 1.14442 9.18957 1.55475L4.54746 8.94069L2.13693 5.95265C1.86325 5.62649 1.57904 5.47919 1.22115 5.47919C0.631672 5.47919 0.147461 5.95265 0.147461 6.56288C0.147461 6.84696 0.242198 7.12051 0.463251 7.37302L3.4843 11.0134Z"
      fill={color || colors.black}
      fillRule="nonzero"
    />
  </Svg>
);

CheckmarkIcon.propTypes = {
  color: PropTypes.string,
};

export default CheckmarkIcon;
