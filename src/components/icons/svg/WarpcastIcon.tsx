import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export function WarpcastIcon({ color = globalColors.grey100, width = 24, height = 17 }: { color: string; width: number; height: number }) {
  return (
    <Svg height={height} viewBox="0 0 24 17" width={width}>
      <Path
        d="M19.3208 0.359863L17.2507 8.04873L15.1738 0.359863H10.3943L8.29752 8.10534L6.20759 0.359863H0.763916L5.82233 17.3599H10.5187L12.7644 9.46571L15.0101 17.3599H19.7166L24.7639 0.359863H19.3208Z"
        fill={color}
      />
    </Svg>
  );
}
