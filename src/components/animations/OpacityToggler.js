import React from 'react';
import Animated from 'react-native-reanimated';

const OpacityToggler = (
  { endingOpacity = 0, isVisible, style, ...props },
  ref
) => {
  const startingOpacity = 1;

  const opacity = isVisible ? endingOpacity : startingOpacity;

  return (
    <Animated.View
      {...props}
      accessible
      ref={ref}
      style={[style, { opacity }]}
    />
  );
};

export default React.forwardRef(OpacityToggler);
