import React, { useContext, useEffect } from 'react';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext from './ChartContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({ height, width, longPressGestureHandlerProps, ...props }) {
  const {
    onLongPressGestureEvent,
    animatedStyle,
    size: layoutSize,
  } = useContext(ChartContext);

  useEffect(() => {
    layoutSize.value = { height, width };
  }, [height, layoutSize, width]);

  return (
    <LongPressGestureHandler
      {...longPressGestureHandlerProps}
      {...{ onGestureEvent: onLongPressGestureEvent }}
    >
      <Animated.View>
        <Svg
          height={height + 20} // temporary fix for clipped chart
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          <AnimatedPath animatedProps={animatedStyle} {...props} />
        </Svg>
      </Animated.View>
    </LongPressGestureHandler>
  );
}

export default ChartPath;
