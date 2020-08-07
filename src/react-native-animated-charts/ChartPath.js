import React, { useContext, useRef } from 'react';
import {
  LongPressGestureHandler,
  PanGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext from './ChartContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({ height, width, ...props }) {
  const {
    onTapGestureEvent,
    onPanGestureEvent,
    animatedStyle,
    size: layoutSize,
  } = useContext(ChartContext);
  const panRef = useRef();
  return (
    <LongPressGestureHandler
      minDurationMs={0}
      simultaneousHandlers={[panRef]}
      {...{ onGestureEvent: onTapGestureEvent }}
    >
      <Animated.View
        onLayout={({
          nativeEvent: {
            layout: { width, height },
          },
        }) => (layoutSize.value = { height, width })}
      >
        <PanGestureHandler
          activeOffsetX={[0, 0]}
          activeOffsetY={[0, 0]}
          {...{ onGestureEvent: onPanGestureEvent }}
          ref={panRef}
        >
          <Animated.View>
            <Svg
              height={height}
              preserveAspectRatio="none"
              viewBox="0 0 1 1"
              width={width}
            >
              <AnimatedPath animatedProps={animatedStyle} {...props} />
            </Svg>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
}

export default ChartPath;
