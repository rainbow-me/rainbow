import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export default function JellySelectorColorIndicator({ backgroundColor, height, translateX, width, ...props }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: width.value,
  }));

  return (
    <Animated.View
      {...props}
      borderRadius={height / 2}
      height={height}
      style={[
        {
          backgroundColor,
        },
        animatedStyle,
      ]}
    />
  );
}
