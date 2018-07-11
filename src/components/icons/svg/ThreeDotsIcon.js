import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';

const ThreeDotsIcon = props => (
  <Svg height="5" width="23" {...props}>
    <G fill="#A9ADB9" fillRule="evenodd">
      <Circle cx="2.5" cy="2.5" r="2.5"/>
      <Circle cx="11.5" cy="2.5" r="2.5"/>
      <Circle cx="20.5" cy="2.5" r="2.5"/>
    </G>
  </Svg>
);

export default ThreeDotsIcon;
