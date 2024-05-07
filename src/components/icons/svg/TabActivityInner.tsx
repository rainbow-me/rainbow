import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabActivityInner = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M14 6.75C14.6904 6.75 15.25 7.30964 15.25 8V14C15.25 14.6904 14.6904 15.25 14 15.25H10C9.30964 15.25 8.75 14.6904 8.75 14C8.75 13.3096 9.30964 12.75 10 12.75H12.75V8C12.75 7.30964 13.3096 6.75 14 6.75Z"
        fill={color}
      />
    </Svg>
  );
};
