import React from 'react';
import Animated from 'react-native-reanimated';

export default function JellySelectorColorIndicator({
  backgroundColor,
  height,
  translateX,
  width,
  ...props
}) {
  return (
    <Animated.View
      {...props}
      borderRadius={height / 2}
      height={height}
      style={{
        backgroundColor,
        transform: [{ translateX }],
        width,
      }}
    />
  );
}
