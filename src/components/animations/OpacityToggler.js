import React from 'react';
import { View } from 'react-native';

const OpacityToggler = ({ endingOpacity = 0, isVisible, style, ...props }, ref) => {
  const startingOpacity = 1;

  const opacity = isVisible ? endingOpacity : startingOpacity;

  return <View {...props} accessible ref={ref} style={[style, { opacity }]} />;
};

export default React.forwardRef(OpacityToggler);
