import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE } from '../constants';
import type { IconProps } from '../LeagueIcon';

export const SlapIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M14 15.888v.667c0 .733-.6 1.333-1.333 1.333H5.334c-.734 0-1.334-.6-1.334-1.333v-.667zm-2.333-14c2.2 0 4 1.8 4 4v4.667l-1.267 4H5l-2.666-4v-2c0-1 .733-1.867 1.732-2 0 .4.068.733.201 1.066.2.533.266 1.067.266 1.6h.934c0-.6-.067-1.2-.267-1.8-.067-.466-.2-.867-.2-1.333v-2.2c0-1.133.867-2 2-2z"
    />
  </Svg>
);
