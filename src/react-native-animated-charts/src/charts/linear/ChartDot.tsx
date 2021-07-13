import React, { useContext } from 'react';
import Animated from 'react-native-reanimated';
import ChartContext from '../../helpers/ChartContext';
import withReanimatedFallback from '../../helpers/withReanimatedFallback';

function ChartDot({ style, size = 10, ...props }) {
  const { dotStyle } = useContext(ChartContext);

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
