import React from 'react';
import { Path, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

const CaretDownIcon = ({ color, ...props }: SvgProps) => (
  <Svg fill="none" height={9} viewBox="0 0 22 9" width={22} xmlns="http://www.w3.org/2000/svg" {...props}>
    <Path
      d="m20 1.48-7.312 5.687a2.75 2.75 0 0 1-3.376 0L2 1.48"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
    />
  </Svg>
);

export default CaretDownIcon;
