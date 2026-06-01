import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE } from '../constants';
import type { IconProps } from '../LeagueIcon';

export const PickleballIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M8.095.777H6.049c-1.657 0-3 1.342-3 2.999V9.02c0 .749.412 1.446 1.042 1.85 1.121.72 2.676 1.816 2.676 2.186v.055h2.656v-.055c0-.37 1.555-1.465 2.675-2.185.63-.405 1.042-1.103 1.042-1.852V3.776a3 3 0 0 0-3-3zM11.326 14.874a2.35 2.35 0 1 1 4.699 0 2.35 2.35 0 0 1-4.7 0M9.497 14.286H6.692v1.469c0 .81.628 1.468 1.403 1.468.774 0 1.402-.657 1.402-1.468z"
    />
  </Svg>
);
