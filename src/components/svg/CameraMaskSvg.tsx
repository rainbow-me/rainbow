import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

export const CameraMaskSvg = ({ ...props }: SvgProps) => (
  <Svg width={390} height={390} fill="none" viewBox="0 0 390 390" {...props}>
    <Path
      d="M40 0H0v40C0 17.909 17.909 0 40 0ZM350 0c22.091 0 40 17.909 40 40V0h-40ZM390 350c0 22.091-17.909 40-40 40h40v-40ZM40 390c-22.091 0-40-17.909-40-40v40h40Z"
      fill="#000"
      opacity="0.8"
    />
  </Svg>
);
