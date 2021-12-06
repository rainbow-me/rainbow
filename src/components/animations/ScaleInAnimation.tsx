import React from 'react';
import Animated from 'react-native-reanimated';
import { interpolate } from './procs';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

export default function ScaleInAnimation({
  from = 0,
  scaleTo = 0.42,
  style,
  to = 100,
  value,
  ...props
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
