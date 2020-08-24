import React, { useContext, useEffect } from 'react';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext from './ChartContext';
import useReactiveSharedValue from './useReactiveSharedValue';
import withReanimatedFallback from './withReanimatedFallback';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({
  height,
  width,
  longPressGestureHandlerProps,
  strokeWidthSelected = 1,
  strokeWidth = 1,
  gestureEnabled = true,
  ...props
}) {
  const strokeWidthSelectedValue = useReactiveSharedValue(strokeWidthSelected);
  const strokeWidthValue = useReactiveSharedValue(strokeWidth);

  const {
    onLongPressGestureEvent,
    path,
    pathOpacity,
    size: layoutSize,
  } = useContext(ChartContext);

  useEffect(() => {
    layoutSize.value = { height, width };
  }, [height, layoutSize, width]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      d: path.value,
      strokeWidth:
        pathOpacity.value *
          (strokeWidthValue.value - strokeWidthSelectedValue.value) +
        strokeWidthSelectedValue.value,
      style: {
        opacity: pathOpacity.value * 0.3 + 0.7,
      },
    };
  });

  return (
    <LongPressGestureHandler
      enabled={gestureEnabled}
      maxDist={100000}
      minDurationMs={0}
      shouldCancelWhenOutside={false}
      strokeLinejoin="round"
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

export default withReanimatedFallback(ChartPath, true);
