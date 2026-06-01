import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE } from '../constants';
import type { IconProps } from '../LeagueIcon';

export const ChessIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M2.963 15.89c0-.618 0-1.118 1.118-1.118h10.26c1.118 0 1.118.5 1.118 1.118 0 .617 0 1.117-1.118 1.117H4.08c-1.118 0-1.118-.5-1.118-1.117M5.246 13.497a23 23 0 0 1 2.698-2.542c2.09-1.68 2.125-3.38 1.243-3.482-.883-.1-2.497.982-3.623 1.762a2.515 2.515 0 0 1-1.45.432c-.816-.015-1.572-.443-1.766-1.303-.314-1.386 1.904-3.532 2.508-4.22.603-.689 1.06-1.611.43-2.38-.505-.617-.07-.771.21-.771h4.54c4.372 0 5.422 3.957 5.422 6.12 0 1.508-.533 4.54-.902 6.384z"
    />
  </Svg>
);
