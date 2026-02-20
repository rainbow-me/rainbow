import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { type IconProps, DEFAULT_SIZE } from '../LeagueIcon';

export const NbaIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      fillRule="evenodd"
      d="M18.446 16.725a8 8 0 0 0 1.327-2.86 6.2 6.2 0 0 0-2.567 1.02c.44.593.854 1.213 1.24 1.84M14.52 19.59a8.05 8.05 0 0 0 3.006-1.812 24 24 0 0 0-1.333-2.02 6.17 6.17 0 0 0-1.667 3.832zm1.453-12.821c0 1.839-.6 3.538-1.613 4.924a25 25 0 0 1 2.013 2.153 7.5 7.5 0 0 1 3.6-1.34c.013-.166.027-.326.027-.5a8 8 0 0 0-4.227-7.05c.127.586.2 1.193.2 1.813m-9.72-.314a25.6 25.6 0 0 1 7.12 4.339 6.97 6.97 0 0 0 .82-6.47c-.7-.2-1.433-.314-2.193-.314-2.26 0-4.294.94-5.747 2.445m1.333 8.704a8.4 8.4 0 0 1-3.173-.627C5.473 17.711 8.466 20.01 12 20.01c.4 0 .786-.04 1.173-.094a7.53 7.53 0 0 1 2.187-5.21q-.872-1.048-1.854-1.987a8.35 8.35 0 0 1-5.913 2.446z"
      clipRule="evenodd"
    />
    <Path
      fill={color}
      fillRule="evenodd"
      d="M12.514 11.813a24.3 24.3 0 0 0-7.14-4.278 7.92 7.92 0 0 0-1.327 5.325 7.025 7.025 0 0 0 8.467-1.053z"
      clipRule="evenodd"
    />
  </Svg>
);
