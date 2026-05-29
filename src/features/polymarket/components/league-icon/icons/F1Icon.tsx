import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE, type IconProps } from '../iconConstants';

export const F1Icon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 18 18" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M12.334 3v3.333l1.293.54v.56a3.69 3.69 0 0 1-1.96 3.254l-1.333 4.98L13 15v2H5v-2l2.667.667-1.333-4.994a3.7 3.7 0 0 1-1.967-3.246v-.554l1.3-.54V3L4.334 1h9.333zm-8 8a.666.666 0 0 1 .666.667v2a.667.667 0 0 1-.667.666h-.666A.667.667 0 0 1 3 13.667v-2A.667.667 0 0 1 3.667 11zm10 0a.666.666 0 0 1 .666.667v2a.667.667 0 0 1-.666.666h-.667a.667.667 0 0 1-.667-.666v-2a.667.667 0 0 1 .667-.667zM3.667 3a.667.667 0 0 1 .667.667v2a.667.667 0 0 1-.667.666H3a.667.667 0 0 1-.667-.666v-2A.667.667 0 0 1 3 3zM15 3a.667.667 0 0 1 .667.667v2a.667.667 0 0 1-.667.666h-.666a.667.667 0 0 1-.667-.666v-2A.667.667 0 0 1 14.334 3z"
    />
  </Svg>
);
