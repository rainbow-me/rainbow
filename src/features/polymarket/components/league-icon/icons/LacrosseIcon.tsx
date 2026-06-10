import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE } from '../constants';
import type { IconProps } from '../LeagueIcon';

export const LacrosseIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M16.996 1c-.015.033-5.195 11.465-6.826 15.206l-.004.009A1.33 1.33 0 0 1 8.95 17H4.363l1.094-3.253h2.247c.515-.007.96-.306 1.18-.747l6.112-12zm-14 16H1.663a.667.667 0 0 1-.62-.893l.62-1.54.003-.01a1.33 1.33 0 0 1 1.23-.824h1.187zM2.33 8.733c.909.397 1.89.602 2.882.6h.164c.613 0 1.213-.066 1.734-.18l.032-.006A5 5 0 0 0 8.33 8.74v1.194c0 .4-.54.766-1.5.973-1.434.306-3.267.127-4.1-.413l-.005-.002a.7.7 0 0 1-.395-.558zm3-2.987c1.65 0 2.987.505 2.987 1.127S6.979 8 5.33 8s-2.986-.504-2.987-1.126S3.68 5.747 5.33 5.747"
    />
  </Svg>
);
