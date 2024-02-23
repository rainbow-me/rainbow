import React from 'react';
import { Path, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

const CaretLeftIcon = ({ color, ...props }: SvgProps) => (
  <Svg fill="none" height={22} viewBox="0 0 9 22" width={9} xmlns="http://www.w3.org/2000/svg" {...props}>
    <Path
      d="M7.52 2 1.833 9.312a2.75 2.75 0 0 0 0 3.376L7.52 20"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
    />
  </Svg>
);

export default CaretLeftIcon;
