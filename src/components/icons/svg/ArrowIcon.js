import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const ArrowIcon = ({ color, height = 10, width = 10, colors, ...props }, ref) => {
  return (
    <Svg height={height} ref={ref} width={width} {...props}>
      <Path
        d="M 4.21 10 C 4.424 10 4.643 9.911 4.789 9.765 L 8.179 6.375 C 8.341 6.208 8.425 6.015 8.425 5.811 C 8.425 5.363 8.101 5.055 7.679 5.055 C 7.444 5.055 7.261 5.159 7.115 5.3 L 5.926 6.489 L 4.945 7.627 L 4.997 6.495 L 4.997 0.814 C 4.997 0.329 4.679 0 4.21 0 C 3.74 0 3.427 0.329 3.427 0.814 L 3.427 6.495 L 3.474 7.627 L 2.493 6.489 L 1.304 5.3 C 1.163 5.159 0.981 5.055 0.746 5.055 C 0.323 5.055 0 5.363 0 5.811 C 0 6.015 0.083 6.208 0.245 6.375 L 3.631 9.765 C 3.777 9.911 3.996 10 4.21 10 Z"
        fill={color || colors.black}
      />
    </Svg>
  );
};

export default React.forwardRef(ArrowIcon);
