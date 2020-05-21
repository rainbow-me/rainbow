import React from 'react';
import SvgPrimitive from 'react-native-svg';
import { reduceArrayToObject } from '../../utils';

// eslint-disable-next-line no-unused-vars
const Svg = React.forwardRef(({ direction, style, ...props }, ref) => (
  // 👆️👨‍🏫️ we purposefully want to prevent the `direction` prop from being passed
  // to the underlying native SvgPrimitive view, so we are going to deconstruct
  // it here and then do nothing with it lol!
  <SvgPrimitive {...props} ref={ref} style={reduceArrayToObject(style)} />
));

Svg.displayName = 'Svg';
export default Svg;
