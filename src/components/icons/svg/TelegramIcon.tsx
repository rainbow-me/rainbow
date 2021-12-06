import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const TelegramIcon = ({ colors, color = colors.black, ...props }) => {
  return (
    <Svg height="21" viewBox="0 1 16 21" width="21" {...props}>
      <Path
        d="m9.417 15.181-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931l3.622-16.972.001-.001c.321-1.496-.541-2.081-1.527-1.714l-21.29 8.151c-1.453.564-1.431 1.374-.247 1.741l5.443 1.693 12.643-7.911c.595-.394 1.136-.176.691.218z"
        fill={color}
        fillRule="nonzero"
      />
    </Svg>
  );
};

export default TelegramIcon;
