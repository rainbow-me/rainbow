import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const AvatarIcon = ({ size }) => (
  <Svg height={size} viewBox="0 0 30 30" width={size}>
    <Path
      d="M4.733 25.936A14.958 14.958 0 0 1 0 15C0 6.716 6.716 0 15 0c8.284 0 15 6.716 15 15a14.959 14.959 0 0 1-4.79 10.99c-1.936-1.83-5.781-3.077-10.21-3.077-4.429 0-8.274 1.246-10.21 3.076l-.057-.053z"
      fill="#888D96"
    />
    <Path
      d="M3.868 25.054a.43.43 0 0 0-.013-.015c1.32-2.458 5.809-4.27 11.145-4.27 5.336 0 9.825 1.812 11.145 4.27A14.962 14.962 0 0 1 15 30a14.962 14.962 0 0 1-11.132-4.946z"
      fill="#25292E"
    />
    <Path d="M20.77 11.539a5.77 5.77 0 1 0-11.54 0 5.77 5.77 0 0 0 11.54 0z" fill="#FFFFFF" />
  </Svg>
);

AvatarIcon.propTypes = {
  size: PropTypes.number,
};

AvatarIcon.defaultProps = {
  size: 30,
};

export default AvatarIcon;
