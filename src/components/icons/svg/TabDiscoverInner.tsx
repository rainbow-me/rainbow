import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabDiscoverInner = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M6 12.25C6 8.79822 8.79822 6 12.25 6C15.7018 6 18.5 8.79822 18.5 12.25C18.5 15.7018 15.7018 18.5 12.25 18.5C8.79822 18.5 6 15.7018 6 12.25Z"
        fill={color}
      />
    </Svg>
  );
};
