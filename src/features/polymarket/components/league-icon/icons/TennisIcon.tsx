import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { type IconProps, DEFAULT_SIZE } from '../LeagueIcon';

export const TennisIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M15.935 8.083a5.66 5.66 0 0 0-2.414-1.414l-.047-.012a6.7 6.7 0 0 1-2.819-1.72l-.667-.667-.056.012a8 8 0 0 1 2.071-.27c2.204 0 4.199.89 5.645 2.331A8 8 0 1 1 4 12.008c0-.713.093-1.404.255-2.005l.687.666a6.4 6.4 0 0 1 1.673 2.813l.01.04a5.55 5.55 0 0 0 2.223 3.094l.148.095a5.58 5.58 0 0 0 6.939-8.628m-6.24-2.16a7.9 7.9 0 0 0 3.447 2l.03.008a4.26 4.26 0 0 1 3.023 4.478l-.001.02a4.3 4.3 0 0 1-1.885 3.12l.014-.009a4.2 4.2 0 0 1-2.356.716c-1.944 0-3.582-1.311-4.086-3.127l-.013-.054A7.74 7.74 0 0 0 5.881 9.73L4.755 8.603h.001l.02-.047A7.86 7.86 0 0 1 8.589 4.77z"
    />
  </Svg>
);
