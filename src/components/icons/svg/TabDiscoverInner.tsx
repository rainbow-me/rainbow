import React from 'react';

import { Path } from 'react-native-svg';

import { globalColors } from '@/design-system';

import Svg from '../Svg';

export const TabDiscoverInner = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M13.779 21.693C11.873 21.693 10.627 20.58 10.627 18.902C10.627 17.203 11.801 16.75 11.946 15.277C11.966 15.071 12.193 14.927 12.409 15.122C12.8 15.524 13.078 16.029 13.284 16.719C13.758 15.73 13.779 14.515 13.562 13.176C13.501 12.898 13.737 12.764 13.964 12.857C16.096 13.753 17.342 15.833 17.342 18.047C17.342 20.158 15.993 21.693 13.779 21.693Z"
        fill={color}
      />
    </Svg>
  );
};
