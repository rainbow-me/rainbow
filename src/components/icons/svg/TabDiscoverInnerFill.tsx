import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabDiscoverInnerFill = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M19.75 12.25C19.75 16.3921 16.3921 19.75 12.25 19.75C8.10786 19.75 4.75 16.3921 4.75 12.25C4.75 8.10786 8.10786 4.75 12.25 4.75C16.3921 4.75 19.75 8.10786 19.75 12.25Z"
        fill={color}
      />
    </Svg>
  );
};
