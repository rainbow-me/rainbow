import * as React from 'react';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { type IconProps, DEFAULT_SIZE } from '../LeagueIcon';

export const ValorantIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <G fill={color} clipPath="url(#valorant_svg__a)">
      <Path d="M3.095 4.704c.11-.065.18.067.24.137 3.827 4.788 7.66 9.573 11.486 14.36.078.069.019.214-.087.199q-2.748.002-5.498 0a.48.48 0 0 1-.377-.185l-5.703-7.128a.5.5 0 0 1-.117-.345V4.857c0-.054-.001-.125.056-.153M20.796 4.693c.078-.03.164.043.152.125.003 2.296 0 4.592.002 6.888a.54.54 0 0 1-.108.367l-1.734 2.168a.49.49 0 0 1-.411.186c-1.82-.002-3.641.001-5.461-.001-.108.017-.169-.129-.09-.199l7.576-9.471a.2.2 0 0 1 .073-.063" />
    </G>
    <Defs>
      <ClipPath id="valorant_svg__a">
        <Path fill="#fff" d="M3 3.01h18v18H3z" />
      </ClipPath>
    </Defs>
  </Svg>
);
