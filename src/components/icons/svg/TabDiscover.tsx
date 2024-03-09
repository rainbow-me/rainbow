import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';
import { globalColors } from '@/design-system';

export const TabDiscover = ({ color = globalColors.grey100 }: { color: string }) => {
  return (
    <Svg height="28" viewBox="0 0 28 28" width="28">
      <Path
        d="M12.25 3.5C7.41751 3.5 3.5 7.41751 3.5 12.25C3.5 17.0825 7.41751 21 12.25 21C14.2154 21 16.0295 20.352 17.4902 19.258L22.3661 24.1339C22.8543 24.622 23.6457 24.622 24.1339 24.1339C24.622 23.6457 24.622 22.8543 24.1339 22.3661L19.258 17.4902C20.352 16.0295 21 14.2154 21 12.25C21 7.41751 17.0825 3.5 12.25 3.5ZM6 12.25C6 8.79822 8.79822 6 12.25 6C15.7018 6 18.5 8.79822 18.5 12.25C18.5 15.7018 15.7018 18.5 12.25 18.5C8.79822 18.5 6 15.7018 6 12.25Z"
        fill={color}
      />
    </Svg>
  );
};
