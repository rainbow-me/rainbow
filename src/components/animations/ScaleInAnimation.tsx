import React from 'react';
import Animated from 'react-native-reanimated';
import { interpolate } from './procs';
import { position } from '@rainbow-me/styles';

export default function ScaleInAnimation({
  from = 0,
  scaleTo = 0.42,
  style,
  to = 100,
  value,
  ...props
}) {
  return (
    <Animated.View
      {...props}
      {...position.centeredAsObject}
      style={[
        style,
        {
          ...position.coverAsObject,
          opacity: interpolate(value, {
            extrapolate: Animated.Extrapolate.CLAMP,
            inputRange: [from, to * 0.1, to * 0.25],
            outputRange: [1, 0.333, 0],
          }),
          transform: [
            {
              scale: interpolate(value, {
                extrapolate: Animated.Extrapolate.IDENTITY,
                inputRange: [from, to * 0.333],
                outputRange: [1, scaleTo],
              }),
            },
          ],
        },
      ]}
    />
  );
}
