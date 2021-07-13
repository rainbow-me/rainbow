import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const BackspaceIcon = ({ color, colors, ...props }) => (
  <Svg height="34" viewBox="0 0 10 17" width="20" {...props}>
    <Path
      d="M9.10857 0.936326C9.69602 1.52044 9.69872 2.47019 9.11461 3.05764L3.70313 8.5L9.1146 13.9424C9.69872 14.5298 9.69602 15.4796 9.10857 16.0637C8.52112 16.6478 7.57138 16.6451 6.98726 16.0576L1.57578 10.6153C0.412239 9.4451 0.412243 7.5549 1.57578 6.38472L6.98726 0.942362C7.57138 0.354911 8.52112 0.352209 9.10857 0.936326Z"
      fill={color || colors.blueGreyDark}
      fillRule="nonzero"
    />
  </Svg>
);

BackspaceIcon.propTypes = {
  color: PropTypes.string,
};

export default BackspaceIcon;
