import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import {
  LongPressGestureHandler,
  LongPressGestureHandlerGestureEvent,
  LongPressGestureHandlerProperties,
} from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  cancelAnimation,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  WithSpringConfig,
  withTiming,
  WithTimingConfig,
  interpolateColor,
  useDerivedValue,
  interpolate,
} from 'react-native-reanimated';
import { getYForX } from 'react-native-redash';
import Svg, { Path, PathProps } from 'react-native-svg';
import { triggerHaptics } from 'react-native-turbo-haptics';
// @ts-ignore this library is no longer maintained independently of the app, so this is fine
import { IS_ANDROID, IS_IOS } from '@/env';
import { ChartData, PathData } from '../../helpers/ChartContext';
import { requireOnWorklet, useWorkletValue } from '../../helpers/requireOnWorklet';
import { useChartData } from '../../helpers/useChartData';

export const FIX_CLIPPED_PATH_MAGIC_NUMBER = 22;
export const FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER = 3;

function least(length: number, compare: (value: number) => number) {
  'worklet';

  let bound1 = 0;
  let bound2 = length - 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pivot = Math.round(bound1 + (bound2 - bound1) / 2);
    if (bound1 === bound2) {
      return bound1;
    }
    const areTwoLeft = bound2 === bound1 + 1;
    if (compare(pivot - 1) - compare(pivot) > 0) {
      // decreasing, dip on the right side decreasing, dip on the right side
      if (areTwoLeft) {
        return pivot;
      }
      bound1 = pivot;
    } else {
      // non-increasing or dip, dip on the left side or in pivot non-increasing or dip, dip on the left side or in pivot
      bound2 = pivot;
      if (areTwoLeft) {
        return pivot - 1;
      }
    }
  }
}

const timingFeedbackDefaultConfig = {
  duration: 80,
};

export const timingAnimationDefaultConfig = {
  duration: 300,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ChartPathProps extends PathProps {
  hapticsEnabled?: boolean;
  hitSlop?: number;
  fill?: string;
  height: number;
  stroke?: string;
  width: number;
  strokeWidth?: number;
  selectedStrokeWidth?: number;
  gestureEnabled?: boolean;
  springConfig?: WithSpringConfig;
  longPressGestureHandlerProps?: LongPressGestureHandlerProperties;
  timingFeedbackConfig?: WithTimingConfig;
  timingAnimationConfig?: WithTimingConfig;
  isCard?: boolean;
}

function positionXWithMargin(x: number, margin: number, width: number) {
  'worklet';
  if (x < margin) {
    return Math.max(3 * x - 2 * margin, 0);
  } else if (width - x < margin) {
    return Math.min(margin + x * 2 - width, width);
  } else {
    return x;
  }
}

const ChartPathInner = React.memo(
  ({
    hitSlop = 0,
    stroke = 'black',
    selectedStroke = 'blue',
    strokeWidth = 1,
    selectedStrokeWidth = 1,
    gestureEnabled = true,
    hapticsEnabled,
    width,
    height,
    containerWidth,
    timingFeedbackConfig,
    timingAnimationConfig,
    longPressGestureHandlerProps,
    positionX,
    positionY,
    originalX,
    originalY,
    state,
    isActive,
    progress,
    currentPath,
    previousPath,
    isCard,
    ...props
  }: ChartPathProps & Omit<ChartData, 'data' | 'dotScale' | 'color'> & { containerWidth: number }) => {
    ChartPathInner.displayName = 'chartPathInner';
    const interpolatorWorklet = useWorkletValue();

    const selectedStrokeProgress = useSharedValue(0);

    const strokeColorAnimated = useDerivedValue(() => {
      return interpolateColor(selectedStrokeProgress.value, [0, 1], [stroke, selectedStroke]);
    });
    const strokeWidthAnimated = useDerivedValue(() => {
      return interpolate(selectedStrokeProgress.value, [0, 1], [strokeWidth, selectedStrokeWidth]);
    });

    useAnimatedReaction(
      () => isActive.value,
      isActive => {
        if (isActive) {
          selectedStrokeProgress.value = withTiming(1, timingFeedbackConfig || timingFeedbackDefaultConfig);
        } else {
          selectedStrokeProgress.value = withTiming(0, timingFeedbackConfig || timingFeedbackDefaultConfig);
        }
      }
    );

    const setOriginData = useCallback(
      (path: PathData, index?: number) => {
        'worklet';
        if (!path.data.length) {
          return;
        }

        if (typeof index === 'undefined') {
          originalX.value = '';
          originalY.value = '';
          return;
        }

        originalX.value = path.data[index].x.toString();
        originalY.value = path.data[index].y.toString();
      },
      [originalX, originalY]
    );

    useEffect(() => {
      runOnUI(() => {
        if (currentPath) {
          setOriginData(currentPath);
        }

        if (currentPath?.path === previousPath?.path) {
          return;
        }

        if (progress.value !== 0 && progress.value !== 1) {
          cancelAnimation(progress);
        }

        // this stores an instance of d3-interpolate-path on worklet side
        // it means that we don't cross threads with that function
        // which makes it super fast
        if (previousPath && currentPath) {
          const d3Interpolate = requireOnWorklet('d3-interpolate-path');

          interpolatorWorklet().value = d3Interpolate.interpolatePath(previousPath.path, currentPath.path);

          progress.value = 0;

          progress.value = withDelay(IS_IOS ? 0 : 100, withTiming(1, timingAnimationConfig || timingAnimationDefaultConfig));
        } else {
          interpolatorWorklet().value = undefined;
          progress.value = 1;
        }
      })();
      // you don't need to change timingAnimationConfig that often
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath?.path, previousPath?.path]);

    const updatePosition = useCallback(
      ({ x, y }: { x: number | null; y: number | null }) => {
        'worklet';
        if (!currentPath || !currentPath.parsed || progress.value === 0 || x === null || y === null) {
          return;
        }

        const yForX = getYForX(currentPath.parsed, x);

        if (yForX !== null) {
          positionY.value = yForX;
        }

        positionX.value = x;

        // refer to this article for more details about this code
        // https://observablehq.com/@d3/multi-line-chart
        const index = least(currentPath.points.length, i => {
          if (typeof i === 'undefined' || x === null) {
            return 0;
          }

          return Math.abs(currentPath.points[i].x - x);
        });

        const pointX = currentPath.points[index]?.originalX;

        let adjustedPointX = pointX;
        if (currentPath.points[index].x > x) {
          const prevPointOriginalX = currentPath.points[index - 1]?.originalX;
          if (prevPointOriginalX) {
            const distance = (currentPath.points[index].x - x) / (currentPath.points[index].x - currentPath.points[index - 1].x);
            adjustedPointX = prevPointOriginalX * distance + pointX * (1 - distance);
          }
        } else {
          const nextPointOriginalX = currentPath.points[index + 1]?.originalX;
          if (nextPointOriginalX) {
            const distance = (x - currentPath.points[index].x) / (currentPath.points[index + 1].x - currentPath.points[index].x);
            adjustedPointX = nextPointOriginalX * distance + pointX * (1 - distance);
          }
        }

        const dataIndex = least(currentPath.data.length, i => {
          if (typeof i === 'undefined' || x === null) {
            return 0;
          }

          return Math.abs(currentPath.data[i].x - adjustedPointX);
        });

        setOriginData(currentPath, dataIndex);
      },
      [currentPath, positionX, positionY, progress, setOriginData]
    );

    const resetGestureState = useCallback(() => {
      'worklet';
      originalX.value = '';
      originalY.value = '';
      positionY.value = -1;
      isActive.value = false;
      updatePosition({ x: null, y: null });
    }, [originalX, originalY, positionY, isActive, updatePosition]);

    const animatedProps = useAnimatedProps(() => {
      if (!currentPath) {
        return {
          d: '',
          strokeWidth,
          stroke,
        };
      }

      return {
        d: interpolatorWorklet().value ? interpolatorWorklet().value(progress.value) : currentPath.path,
        strokeWidth: strokeWidthAnimated.value,
        stroke: strokeColorAnimated.value,
      };
    }, [currentPath]);

    const onGestureEvent = useAnimatedGestureHandler<LongPressGestureHandlerGestureEvent>(
      {
        onActive: event => {
          if (!isActive.value) {
            isActive.value = true;
            if (hapticsEnabled) triggerHaptics('soft');
          }
          state.value = event.state;
          updatePosition({ x: positionXWithMargin(event.x, hitSlop, width), y: event.y });
        },
        onCancel: event => {
          state.value = event.state;
          resetGestureState();
        },
        onEnd: event => {
          state.value = event.state;
          resetGestureState();

          if (hapticsEnabled) triggerHaptics('soft');
        },
        onFail: event => {
          state.value = event.state;
          resetGestureState();
        },
        onStart: event => {
          // WARNING: the following code does not run on using iOS, but it does on Android.
          // I use the same code from onActive
          // platform is for safety
          if (IS_ANDROID) {
            state.value = event.state;
            isActive.value = true;

            if (hapticsEnabled) triggerHaptics('soft');
          }
        },
      },
      [width, height, hapticsEnabled, hitSlop, timingFeedbackConfig, updatePosition]
    );

    return (
      <LongPressGestureHandler
        enabled={gestureEnabled}
        maxDist={100000}
        minDurationMs={0}
        onGestureEvent={onGestureEvent}
        shouldCancelWhenOutside={false}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...longPressGestureHandlerProps}
      >
        <Animated.View>
          <Svg
            style={{
              height: height + (isCard ? FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER : FIX_CLIPPED_PATH_MAGIC_NUMBER),
              width: containerWidth,
            }}
            viewBox={`0 0 ${containerWidth} ${height}`}
          >
            <AnimatedPath
              animatedProps={animatedProps}
              strokeLinecap="round"
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
            />
          </Svg>
        </Animated.View>
      </LongPressGestureHandler>
    );
  }
);

export const ChartPath = React.memo(
  ({
    hapticsEnabled,
    width,
    height,
    hitSlop,
    selectedStrokeWidth,
    strokeWidth,
    gestureEnabled,
    timingFeedbackConfig,
    timingAnimationConfig,
    longPressGestureHandlerProps = {},
    isCard = false,
    ...props
  }: ChartPathProps) => {
    const {
      positionX,
      positionY,
      originalX,
      originalY,
      state,
      isActive,
      progress,
      currentPath,
      previousPath,
      stroke,
      width: chartPathWidth,
      selectedStroke,
    } = useChartData();

    return (
      <View style={{ height, width }}>
        {currentPath?.path ? (
          <Animated.View entering={FadeIn.duration(140)}>
            <ChartPathInner
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...{
                ...props,
                currentPath,
                isCard,
                gestureEnabled,
                hapticsEnabled,
                height,
                hitSlop,
                isActive,
                longPressGestureHandlerProps,
                originalX,
                originalY,
                positionX,
                positionY,
                previousPath,
                progress,
                selectedStrokeWidth,
                state,
                stroke,
                selectedStroke,
                strokeWidth,
                timingAnimationConfig,
                timingFeedbackConfig,
                width: chartPathWidth,
                containerWidth: width,
              }}
            />
          </Animated.View>
        ) : null}
      </View>
    );
  }
);

ChartPath.displayName = 'ChartPath';
