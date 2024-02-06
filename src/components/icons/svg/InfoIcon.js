import React from 'react';
import Svg, { Path } from 'react-native-svg';

const InfoIcon = ({ color, colors, size, ...props }) => (
  <Svg viewBox="0 0 18 18" {...props} height={size || props.height} width={size || props.width}>
    <Path
      d="M8.991 0C13.926 0 18 4.072 18 9.004 18 13.937 13.935 18 9 18s-9-4.063-9-8.996C0 4.072 4.056 0 8.991 0zm.285 7.463H7.622c-.413 0-.74.31-.74.706 0 .43.327.723.74.723h.835v3.306h-.99a.724.724 0 00-.74.714c0 .422.327.724.74.724h3.48c.413 0 .74-.302.74-.724a.724.724 0 00-.74-.714h-.862V8.385c0-.56-.284-.922-.81-.922zm-.31-3.71c-.664 0-1.215.543-1.215 1.231 0 .663.551 1.223 1.215 1.223.68 0 1.223-.56 1.223-1.223 0-.688-.543-1.23-1.223-1.23z"
      fill={color || colors.white}
      fillRule="nonzero"
    />
  </Svg>
);

export default InfoIcon;
