import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const CaretIcon = ({ color, colors, size, ...props }, ref) => (
  <Svg {...props} height={size ? (size * 21) / 9 : '21'} ref={ref} viewBox={`0 0 ${ios ? 9 : 10} 21`} width={size || ios ? 9 : 10}>
    <Path
      d="M0.712582 0.51331C0.167648 0.937147 0.0694796 1.72249 0.493317 2.26743L6.18017 9.57909C6.60146 10.1208 6.60146 10.8792 6.18017 11.4209L0.493317 18.7326C0.0694796 19.2775 0.167648 20.0629 0.712582 20.4867C1.25752 20.9105 2.04286 20.8124 2.4667 20.2674L8.15355 12.9558C9.277 11.5113 9.277 9.48868 8.15355 8.04424L2.4667 0.732574C2.04286 0.18764 1.25752 0.089472 0.712582 0.51331Z"
      fill={color || colors.dark}
      fillRule="nonzero"
    />
  </Svg>
);

export default React.forwardRef(CaretIcon);
