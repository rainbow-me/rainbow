import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconProps, DEFAULT_SIZE } from '../LeagueIcon';

export const HockeyIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M20.884 3.111c-.017.037-5.772 12.74-7.585 16.896l-.004.01a1.48 1.48 0 0 1-1.35.872H6.847l1.215-3.615h2.497a1.49 1.49 0 0 0 1.31-.83l6.793-13.333zM5.329 20.888H3.848a.74.74 0 0 1-.689-.991l.689-1.712.003-.01a1.48 1.48 0 0 1 1.367-.916h1.318zm-.74-9.183c1.01.441 2.1.668 3.202.667l.13-.001h.052c.682 0 1.348-.073 1.926-.2l.037-.006a5.5 5.5 0 0 0 1.319-.453v1.325c0 .445-.6.852-1.667 1.082-1.592.34-3.63.141-4.555-.459l-.005-.002a.78.78 0 0 1-.44-.62zm3.333-3.32c1.832 0 3.319.562 3.319 1.253s-1.487 1.251-3.32 1.251-3.317-.56-3.318-1.251S6.09 8.386 7.922 8.386"
    />
  </Svg>
);
