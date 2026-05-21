import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE, type IconProps } from '../LeagueIcon';

export const LolIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M12 2.75c5.109 0 9.25 4.141 9.25 9.25s-4.141 9.25-9.25 9.25S2.75 17.109 2.75 12 6.891 2.75 12 2.75m0 2.1A7.15 7.15 0 1 0 12 19.15 7.15 7.15 0 0 0 12 4.85m-3.1 3.1h2.35v6.25h4.05v1.95H8.9zm6.58.05h1.96v1.96h-1.96zm0 2.72h1.96v5.43h-1.96z"
    />
  </Svg>
);
