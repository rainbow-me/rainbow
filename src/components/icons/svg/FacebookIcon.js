import React from 'react';
import { Circle, Path } from 'react-native-svg';
import Svg from '../Svg';

const FacebookIcon = ({ colors, color = colors.black, secondaryColor = colors.white, ...props }) => {
  return (
    <Svg height="21" viewBox="0 0 30 30" width="21" {...props}>
      <Circle cx="15" cy="15" fill={color} r="15" />
      <Path
        d="M16.4,23.9v-8.1h2.7l0.4-3.2h-3.1v-2c0-0.9,0.3-1.5,1.6-1.5l1.7,0V6.2c-0.3,0-1.3-0.1-2.4-0.1  c-2.4,0-4.1,1.5-4.1,4.2v2.3h-2.7v3.2h2.7v8.1H16.4z"
        fill={secondaryColor}
      />
    </Svg>
  );
};

export default FacebookIcon;
