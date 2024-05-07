import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabHomeInner = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M11 16.4C11 15.5599 11 15.1399 11.1635 14.819C11.3073 14.5368 11.5368 14.3073 11.819 14.1635C12.1399 14 12.5599 14 13.4 14H14.6C15.4401 14 15.8601 14 16.181 14.1635C16.4632 14.3073 16.6927 14.5368 16.8365 14.819C17 15.1399 17 15.5599 17 16.4V18.6C17 19.4401 17 19.8601 16.8365 20.181C16.6927 20.4632 16.4632 20.6927 16.181 20.8365C15.8601 21 15.4401 21 14.6 21H13.4C12.5599 21 12.1399 21 11.819 20.8365C11.5368 20.6927 11.3073 20.4632 11.1635 20.181C11 19.8601 11 19.4401 11 18.6V16.4Z"
        fill={color}
      />
    </Svg>
  );
};
