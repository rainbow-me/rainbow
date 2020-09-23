import React, { useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import ChartContext from '../../helpers/ChartContext';
import withReanimatedFallback from '../../helpers/withReanimatedFallback';

function ChartDot({ style, size = 10, ...props }) {
  const { dotScale, positionX, positionY } = useContext(ChartContext);
  const dotStyle = useAnimatedStyle(
    () => ({
      opacity: dotScale.value,
      transform: [
        { translateX: positionX.value },
        { translateY: positionY.value + 10 }, // TODO temporary fix for clipped chart
        { scale: dotScale.value },
      ],
    }),
    undefined,
    'dotStyle'
  );

  return (
    <Animated.View
      {...props}
      pointerEvents="none"
      style={[
        dotStyle,
        {
          borderRadius: size / 2,
          height: size,
          left: -size / 2,
          position: 'absolute',
          top: -size / 2,
          width: size,
        },
        style,
      ]}
    />
  );
}

export default withReanimatedFallback(ChartDot);
