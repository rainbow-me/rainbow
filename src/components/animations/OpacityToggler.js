import React from 'react';
import Animated from 'react-native-reanimated';

const OpacityToggler = ({ isVisible, style, ...props }, ref) => {
  return (
    <Animated.View
      {...props}
      accessible
      ref={ref}
      style={[style, { display: isVisible ? 'none' : 'flex' }]}
    />
  );
};

export default React.forwardRef(OpacityToggler);
