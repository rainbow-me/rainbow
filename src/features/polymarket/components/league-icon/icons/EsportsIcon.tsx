import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE, type IconProps } from '../iconConstants';

export const EsportsIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M7.18 8.25h9.64c2.12 0 3.87 1.67 3.98 3.79l.17 3.35a2.72 2.72 0 0 1-4.77 1.91l-1.8-2.05H9.6l-1.8 2.05a2.72 2.72 0 0 1-4.77-1.91l.17-3.35a3.99 3.99 0 0 1 3.98-3.79m1.2 3.12a.72.72 0 0 0-1.44 0v.86h-.86a.72.72 0 0 0 0 1.44h.86v.86a.72.72 0 0 0 1.44 0v-.86h.86a.72.72 0 1 0 0-1.44h-.86zm7.48.12a.94.94 0 1 0 0 1.88.94.94 0 0 0 0-1.88m2.1 2.09a.94.94 0 1 0 0 1.88.94.94 0 0 0 0-1.88M10.88 5.03h2.24c.53 0 .96.43.96.96v.9H9.92v-.9c0-.53.43-.96.96-.96"
    />
  </Svg>
);
