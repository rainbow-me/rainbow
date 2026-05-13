import React from 'react';

import { Path } from 'react-native-svg';

import { globalColors } from '@/design-system';

import Svg from '../Svg';

export const TabDiscoverInnerFill = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M13.49 25.75C19.37 25.75 23.284 21.826 23.284 15.926C23.284 6.307 14.963 2.25 9.34 2.25C8.001 2.25 7.085 2.827 7.085 3.867C7.085 4.268 7.27 4.691 7.548 5.03C8.949 6.73 9.937 8.14 9.979 9.912C9.237 8.46 8.424 8.027 7.651 8.027C6.961 8.027 6.508 8.46 6.508 9.232C6.508 9.706 6.58 10.087 6.58 10.756C6.58 13.279 4.716 14.072 4.716 18.129C4.716 22.702 8.228 25.75 13.49 25.75Z"
        fill={color}
      />
    </Svg>
  );
};
