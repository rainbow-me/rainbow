import React, { useContext, useEffect, useRef } from 'react';
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

  useEffect(() => {
    layoutSize.value = { height, width };
  }, [height, layoutSize, width]);

  const panRef = useRef();
  return (
    <PanGestureHandler
      activeOffsetX={[0, 0]}
      activeOffsetY={[0, 0]}
      simultaneousHandlers={[panRef]}
      {...panGestureHandlerProps}
      {...{ onGestureEvent: onPanGestureEvent }}
    >
      <Animated.View>
        <TapGestureHandler
          minDurationMs={0}
          ref={panRef}
          {...tapGestureHandlerProps}
          {...{ onGestureEvent: onTapGestureEvent }}
        >
          <Animated.View>
            <Svg
              height={height}
              viewBox={`0 0 ${width} ${height}`}
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
