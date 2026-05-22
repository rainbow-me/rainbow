import * as React from 'react';

import Svg, { Path } from 'react-native-svg';

import { DEFAULT_SIZE, type IconProps } from '../LeagueIcon';

export const MotorsportsIcon = ({ color, width = DEFAULT_SIZE, height = DEFAULT_SIZE }: IconProps) => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none">
    <Path
      fill={color}
      d="M5.52 4.25c.38 0 .69.31.69.69v12.79a.69.69 0 0 1-1.38 0V4.94c0-.38.31-.69.69-.69m2.27 1.23c.91-.43 1.93-.36 2.96.01.45.17.91.38 1.4.6 1.2.55 2.56 1.18 4.47.8l1.71-.35a.72.72 0 0 1 .86.71v6.54c0 .34-.24.64-.58.71l-1.44.29c-2.4.48-4.18-.33-5.49-.94-.45-.2-.84-.38-1.18-.5-.75-.27-1.35-.3-1.94-.02l-.97.46a.72.72 0 0 1-1.03-.65V6.73c0-.28.16-.54.41-.66zm.22 1.71v4.81c.75-.25 1.52-.12 2.31.16V7.04c-.73-.24-1.27-.25-1.68-.06zm3.69.36v5.16l.54.25c.38.18.78.36 1.21.51V8.3c-.43-.15-.82-.33-1.2-.51zm3.13 1.08v5.16c.58.01 1.22-.04 1.93-.18l.98-.2V8.14l-.84.17c-.76.15-1.45.24-2.07.32"
    />
  </Svg>
);
