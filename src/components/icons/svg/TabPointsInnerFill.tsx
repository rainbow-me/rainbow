import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabPointsInnerFill = ({ color = globalColors.grey100, size = 28 }: { color: string; size: 28 }) => {
  return (
    <Svg height={size} viewBox="0 0 28 28" width={size}>
      <Path
        d="M13.5702 16.021C14.8553 16.2942 16.1359 16.3389 17.3696 16.1827C18.4332 16.8272 19.6212 17.3072 20.9063 17.5803C21.7092 17.751 22.5104 17.8325 23.2994 17.8315C24.2344 17.8304 25.0029 17.1135 25.0716 16.1811C25.4837 10.5913 21.7149 5.41595 16.079 4.21801C10.4432 3.02007 4.89522 6.21504 2.99806 11.4892C2.68159 12.369 3.09209 13.3365 3.94576 13.7178C4.66619 14.0396 5.4312 14.291 6.23411 14.4617C7.51923 14.7348 8.79978 14.7796 10.0335 14.6233C11.0971 15.2679 12.2851 15.7478 13.5702 16.021Z"
        fill={color}
      />
    </Svg>
  );
};
