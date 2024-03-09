import React from 'react';
import { Circle } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabDappBrowserInnerFill = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Circle cx="14" cy="14" fill={color} r="10" />
    </Svg>
  );
};
