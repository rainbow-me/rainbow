import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const ArrowCircledIcon = ({ color, colors, ...props }, ref) => {
  return (
    <Svg height="15" ref={ref} viewBox="0 0 14 15" width="14" {...props}>
      <Path
        d="M6.222 1.633V8.75l-2.18-2.186a.778.778 0 0 0-1.1 1.102l3.501 3.508a.777.777 0 0 0 1.1 0l3.502-3.508a.778.778 0 0 0-1.1-1.102L7.778 8.738V1.633c0-.58.507-1.036 1.066-.883a7 7 0 1 1-3.687 0c.558-.153 1.065.303 1.065.883z"
        fill={color || colors.black}
        fillRule="nonzero"
      />
    </Svg>
  );
};

export default React.forwardRef(ArrowCircledIcon);
