import React, { useEffect } from 'react';
import { Platform, View, ViewProps } from 'react-native';
import {
  LongPressGestureHandler,
  LongPressGestureHandlerGestureEvent,
  LongPressGestureHandlerProperties,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  cancelAnimation,
  runOnJS,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  useWorkletCallback,
  withDelay,
  WithSpringConfig,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated';
import { getYForX } from 'react-native-redash';
import Svg, { Path, PathProps } from 'react-native-svg';
import { ChartData, PathData } from '../../helpers/ChartContext';
import {
  requireOnWorklet,
  useWorkletValue,
} from '../../helpers/requireOnWorklet';
import { useChartData } from '../../helpers/useChartData';

export const FIX_CLIPPED_PATH_MAGIC_NUMBER = 22;
const FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER = 3;

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

function impactHeavy() {
  'worklet';
  runOnJS(() => ReactNativeHapticFeedback.trigger('impactHeavy'));
}

const timingFeedbackDefaultConfig = {
  duration: 80,
};

const timingAnimationDefaultConfig = {
  duration: 300,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ChartPathProps extends PathProps {
  hapticsEnabled?: boolean;
  hitSlop?: number;
  fill?: string;
  height: number;
  width: number;
  selectedStrokeWidth?: number;
  selectedOpacity?: number;
  strokeWidth?: number;
  stroke?: string;
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
    selectedStrokeWidth = 1,
    strokeWidth = 1,
    gestureEnabled = true,
    selectedOpacity = 0.7,
    hapticsEnabled,
    width,
    height,
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
    pathOpacity,
    currentPath,
    previousPath,
    isCard,
    ...props
  }: ChartPathProps & Omit<ChartData, 'data' | 'dotScale'>) => {
    ChartPathInner.displayName = 'chartPathInner';
    const interpolatorWorklet = useWorkletValue();

    const translationX = useSharedValue<number | null>(null);
    const translationY = useSharedValue<number | null>(null);

    const setOriginData = useWorkletCallback(
      (path: PathData, index?: number) => {
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
      []
    );

    const resetGestureState = useWorkletCallback(() => {
      originalX.value = '';
      originalY.value = '';
      positionY.value = -1;
      isActive.value = false;
      pathOpacity.value = withTiming(
        1,
        timingFeedbackConfig || timingFeedbackDefaultConfig
      );
      translationX.value = null;
      translationY.value = null;
    }, []);

    useEffect(() => {
      runOnUI(() => {
        'worklet';
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

          interpolatorWorklet().value = d3Interpolate.interpolatePath(
            previousPath.path,
            currentPath.path
          );

          progress.value = 0;

          progress.value = withDelay(
            Platform.OS === 'ios' ? 0 : 100,
            withTiming(1, timingAnimationConfig || timingAnimationDefaultConfig)
          );
        } else {
          interpolatorWorklet().value = undefined;
          progress.value = 1;
        }
      })();
      // you don't need to change timingAnimationConfig that often
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPath?.path, previousPath?.path]);

    useAnimatedReaction(
      () => ({ x: translationX.value, y: translationY.value }),
      values => {
        if (
          !currentPath ||
          !currentPath.parsed ||
          progress.value === 0 ||
          values.x === null ||
          values.y === null
        ) {
          return;
        }

        const yForX = getYForX(currentPath.parsed, values.x);

        if (yForX !== null) {
          positionY.value = yForX;
        }

        positionX.value = values.x;

        // refer to this article for more details about this code
        // https://observablehq.com/@d3/multi-line-chart
        const index = least(currentPath.points.length, i => {
          if (typeof i === 'undefined' || values.x === null) {
            return 0;
          }

          return Math.abs(currentPath.points[i].x - values.x);
        });

        const pointX = currentPath.points[index]?.originalX;

        let adjustedPointX = pointX;
        if (currentPath.points[index].x > values.x) {
          const prevPointOriginalX = currentPath.points[index - 1]?.originalX;
          if (prevPointOriginalX) {
            const distance =
              (currentPath.points[index].x - values.x) /
              (currentPath.points[index].x - currentPath.points[index - 1].x);
            adjustedPointX =
              prevPointOriginalX * distance + pointX * (1 - distance);
          }
        } else {
          const nextPointOriginalX = currentPath.points[index + 1]?.originalX;
          if (nextPointOriginalX) {
            const distance =
              (values.x - currentPath.points[index].x) /
              (currentPath.points[index + 1].x - currentPath.points[index].x);
            adjustedPointX =
              nextPointOriginalX * distance + pointX * (1 - distance);
          }
        }

        const dataIndex = least(currentPath.data.length, i => {
          if (typeof i === 'undefined' || values.x === null) {
            return 0;
          }

          return Math.abs(currentPath.data[i].x - adjustedPointX);
        });

        setOriginData(currentPath, dataIndex);
      },
      [currentPath]
    );

    const animatedProps = useAnimatedProps(() => {
      const props: PathProps & ViewProps = {};

      if (!currentPath) {
        return {
          d: '',
        };
      }

      props.d = interpolatorWorklet().value
        ? interpolatorWorklet().value(progress.value)
        : currentPath.path;

      props.strokeWidth =
        pathOpacity.value *
          (Number(strokeWidth) - Number(selectedStrokeWidth)) +
        Number(selectedStrokeWidth);

      if (Platform.OS === 'ios') {
        props.style = {
          opacity: pathOpacity.value * (1 - selectedOpacity) + selectedOpacity,
        };
      }

      return props;
    }, [currentPath]);

    const onGestureEvent = useAnimatedGestureHandler<LongPressGestureHandlerGestureEvent>(
      {
        onActive: event => {
          if (!isActive.value) {
            isActive.value = true;

            pathOpacity.value = withTiming(
              0,
              timingFeedbackConfig || timingFeedbackDefaultConfig
            );

            if (hapticsEnabled) {
              impactHeavy();
            }
          }

          state.value = event.state;
          translationX.value = positionXWithMargin(event.x, hitSlop, width);
          translationY.value = event.y;
        },
        onCancel: event => {
          state.value = event.state;
          resetGestureState();
        },
        onEnd: event => {
          state.value = event.state;
          resetGestureState();

          if (hapticsEnabled) {
            impactHeavy();
          }
        },
        onFail: event => {
          state.value = event.state;
          resetGestureState();
        },
        onStart: event => {
          // WARNING: the following code does not run on using iOS, but it does on Android.
          // I use the same code from onActive
          // platform is for safety
          if (Platform.OS === 'android') {
            state.value = event.state;
            isActive.value = true;
            pathOpacity.value = withTiming(
              0,
              timingFeedbackConfig || timingFeedbackDefaultConfig
            );

            if (hapticsEnabled) {
              impactHeavy();
            }
          }
        },
      },
      [width, height, hapticsEnabled, hitSlop, timingFeedbackConfig]
    );

    const pathAnimatedStyles = useAnimatedStyle(() => {
      return {
        opacity: pathOpacity.value * (1 - selectedOpacity) + selectedOpacity,
      };
    });

    return (
      // @ts-expect-error We use an old version of RNGH which doesn't support React 18 types well
      <LongPressGestureHandler
        enabled={gestureEnabled}
        maxDist={100000}
        minDurationMs={0}
        onGestureEvent={onGestureEvent}
        shouldCancelWhenOutside={false}
        {...longPressGestureHandlerProps}
      >
        <Animated.View>
          <Svg
            style={{
              height:
                height +
                (isCard
                  ? FIX_CLIPPED_PATH_FOR_CARD_MAGIC_NUMBER
                  : FIX_CLIPPED_PATH_MAGIC_NUMBER),
              width,
            }}
            viewBox={`0 0 ${width} ${height}`}
          >
            <AnimatedPath
              // @ts-expect-error
              animatedProps={animatedProps}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={pathAnimatedStyles}
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
    stroke,
    selectedStrokeWidth,
    strokeWidth,
    gestureEnabled,
    selectedOpacity,
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
      pathOpacity,
      currentPath,
      previousPath,
    } = useChartData();

    let renderPath = null;

    // this is workaround to avoid unnecessary rerenders of the path component
    // and sometimes blank SvgPath the currentPath's path string is empty
    // due to some broken logic in the Rainbow app
    if (currentPath?.path) {
      renderPath = (
        <ChartPathInner
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
            pathOpacity,
            positionX,
            positionY,
            previousPath,
            progress,
            selectedOpacity,
            selectedStrokeWidth,
            state,
            stroke,
            strokeWidth,
            timingAnimationConfig,
            timingFeedbackConfig,
            width,
          }}
        />
      );
    }

    return <View style={{ height, width }}>{renderPath}</View>;
  }
);

ChartPath.displayName = 'ChartPath';
