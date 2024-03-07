import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabActivity = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M14 2.75C7.7868 2.75 2.75 7.7868 2.75 14C2.75 20.2132 7.7868 25.25 14 25.25C20.2132 25.25 25.25 20.2132 25.25 14C25.25 7.7868 20.2132 2.75 14 2.75ZM5.25 14C5.25 9.16751 9.16751 5.25 14 5.25C18.8325 5.25 22.75 9.16751 22.75 14C22.75 18.8325 18.8325 22.75 14 22.75C9.16751 22.75 5.25 18.8325 5.25 14Z"
        fill={color}
      />
    </Svg>
  );
};
