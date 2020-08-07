import React, { useContext, useRef } from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext from './ChartContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({
  height,
  width,
  panGestureHandlerProps,
  tapGestureHandlerProps,
  ...props
}) {
  const {
    onTapGestureEvent,
    onPanGestureEvent,
    animatedStyle,
    size: layoutSize,
  } = useContext(ChartContext);
  const panRef = useRef();
  return (
    <PanGestureHandler
      activeOffsetX={[0, 0]}
      activeOffsetY={[0, 0]}
      simultaneousHandlers={[panRef]}
      {...panGestureHandlerProps}
      {...{ onGestureEvent: onPanGestureEvent }}
    >
      <Animated.View
        onLayout={({
          nativeEvent: {
            layout: { width, height },
          },
        }) => (layoutSize.value = { height, width })}
      >
        <TapGestureHandler
          minDurationMs={0}
          ref={panRef}
          {...tapGestureHandlerProps}
          {...{ onGestureEvent: onTapGestureEvent }}
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
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

export default ChartPath;
