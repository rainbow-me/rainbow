import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabLaunchpad = ({ color = globalColors.grey100 }: { color?: string }) => {
  return (
    <Svg height="28" width="28" viewBox="4 1 28 28">
      <Path
        d="M9.70777 20.2507L7.45499 9.43732L14.205 12.8123L18.705 6.06232L23.205 12.8123L29.955 9.43732L27.7022 20.2507C27.3761 21.8157 25.9968 22.9373 24.3982 22.9373H13.0118C11.4132 22.9373 10.0338 21.8157 9.70777 20.2507Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="square"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};
