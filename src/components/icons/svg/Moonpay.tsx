import React from 'react';
import { Path, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

export function Moonpay({ color, ...props }: SvgProps) {
  return (
    <Svg viewBox="0 0 865 865" width="865" height="865" fill="none" {...props}>
      <Path
        fill={color}
        d="M620.65 329.071a82.51 82.51 0 1 0-76.23-50.933 82.496 82.496 0 0 0 76.23 50.933ZM367.655 700.674a201.12 201.12 0 0 1-185.809-124.153 201.113 201.113 0 0 1 146.573-274.218 201.118 201.118 0 1 1 39.236 398.371Z"
      />
    </Svg>
  );
}
