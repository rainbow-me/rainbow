import React from 'react';
import { Path, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

export function Coinbase({ color, ...props }: SvgProps) {
  return (
    <Svg viewBox="0 0 140 142" width="140" height="142" fill="none" {...props}>
      <Path
        fill={color}
        d="M106 54.94c-5.03-15.32-18.28-25.62-34.98-25.62-23.05 0-38.95 17.7-38.96 41.74 0 23.77 16.16 41.47 39.22 41.47 16.7 0 29.95-10.57 34.72-25.89h33.4c-6.1 33.02-33.66 55.21-68.11 55.21C30.48 141.85 0 111.74 0 71.06 0 30.38 31.27 0 71.29 0c35.24 0 62.27 22.19 68.37 54.94H106Z"
      />
    </Svg>
  );
}
