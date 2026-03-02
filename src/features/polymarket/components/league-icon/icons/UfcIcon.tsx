import * as React from 'react';
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg';
import { type IconProps, DEFAULT_SIZE } from '../LeagueIcon';

export const UfcIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <G clipPath="url(#UFC_svg__a)">
      <Path
        fill={color}
        d="M17.331 18.897v.668a1.334 1.334 0 0 1-1.333 1.333H9.003a1.334 1.334 0 0 1-1.334-1.333v-.668zM14.074 4.9a2 2 0 0 1 1.37.609h1.261a2 2 0 0 1 1.96 2v2.054q.01.137 0 .274v3.727l-1.333 4H7.664l-2.334-4V8.895a.72.72 0 0 1 .76-.667h.573v-.72a2 2 0 0 1 2-2h1.24a2 2 0 0 1 2.761-.093 2 2 0 0 1 1.41-.516M6.663 9.562v1.334H9.33a1.33 1.33 0 0 0 1.027-.48c.199-.24.308-.542.307-.853zm7.335-3.334a.667.667 0 0 0-.667.667v3.334a.667.667 0 0 0 1.334 0V6.895a.67.67 0 0 0-.667-.667m2 .614v3.387a2 2 0 0 1-.153.667h.153a1.334 1.334 0 0 0 1.334-1.334V7.508a.667.667 0 0 0-.667-.666zm-7.295 0a.667.667 0 0 0-.667.666l-.04.72H9.33V6.842zm2.628-.614a.667.667 0 0 0-.667.667v1.333h1.333V6.895a.667.667 0 0 0-.666-.667"
      />
    </G>
    <Defs>
      <ClipPath id="UFC_svg__a">
        <Path fill="#fff" d="M3 3.01h18v18H3z" />
      </ClipPath>
    </Defs>
  </Svg>
);
