import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabActivityInnerFill = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M24 14C24 19.5228 19.5228 24 14 24C8.47715 24 4 19.5228 4 14C4 8.47715 8.47715 4 14 4C19.5228 4 24 8.47715 24 14Z"
        fill={color}
      />
    </Svg>
  );
};
