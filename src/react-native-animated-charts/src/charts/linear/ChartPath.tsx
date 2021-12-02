import React, { useEffect } from 'react';
import { Platform, View, ViewProps, ViewStyle } from 'react-native';
import {
  LongPressGestureHandler,
  LongPressGestureHandlerGestureEvent,
  LongPressGestureHandlerProps,
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
  useWorkletCallback,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as redash from 'react-native-redash';
import Svg, { Path, PathProps } from 'react-native-svg';
import { PathData } from '../../helpers/ChartContext';
import { useChartData } from '../../helpers/useChartData';
import {
  requireOnWorklet,
  useWorkletValue,
} from '../../helpers/requireOnWorklet';

function ascending(a?: number, b?: number) {
  'worklet';

  return a == null || b == null
    ? NaN
    : a < b
    ? -1
    : a > b
    ? 1
    : a >= b
    ? 0
    : NaN;
}

function least(length: number, compare: typeof ascending = ascending) {
  'worklet';

  let min;
  let defined = false;

  let minValue;
  for (let i = 0; i < length; i++) {
    const value = compare(i);
    if (
      defined ? ascending(value, minValue) < 0 : ascending(value, value) === 0
    ) {
      min = i;
      minValue = value;
      defined = true;
    }
  }

  return min;
}

function impactHeavy() {
  'worklet';
  (runOnJS
    ? runOnJS(ReactNativeHapticFeedback.trigger)
    : ReactNativeHapticFeedback.trigger)('impactHeavy');
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
  springConfig?: Animated.WithSpringConfig;
  longPressGestureHandlerProps?: LongPressGestureHandlerProps;
  timingFeedbackConfig?: Animated.WithTimingConfig;
  timingAnimationConfig?: Animated.WithTimingConfig;
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

export const ChartPath: React.FC<ChartPathProps> = React.memo(
  ({
    hapticsEnabled,
    hitSlop = 0,
    width,
    height,
    stroke = 'black',
    selectedStrokeWidth = 1,
    strokeWidth = 1,
    gestureEnabled = true,
    selectedOpacity = 0.7,
    timingFeedbackConfig,
    timingAnimationConfig,
    longPressGestureHandlerProps = {},
    ...props
  }) => {
    const {
      positionX,
      positionY,
      originalX,
      originalY,
      state,
      isActive,
      progress,
      pathOpacity,
      paths,
      currentPath,
    } = useChartData();

    console.log('Render chart');
    const interpolatorWorklet = useWorkletValue();

    const setOriginData = useWorkletCallback(
      (path: PathData, index: number = 0) => {
        if (!path.data.length) {
          return;
        }

        console.log('setOrigiinData', index);

        originalX.value = path.data[index].x.toString();
        originalY.value = path.data[index].y.toString();
      },
      []
    );

    useEffect(() => {
      if (paths[0].path === paths[1].path) {
        return;
      }

      console.log('Effect');

      runOnUI(() => {
        'worklet';

        // setOriginData(paths[1]);

        if (progress.value !== 0 && progress.value !== 1) {
          cancelAnimation(progress);
        }

        // this stores an instance of d3-interpolate-path on worklet side
        // it means that we don't cross threads with that function
        // which makes it super fast
        interpolatorWorklet().value = requireOnWorklet(
          'd3-interpolate-path'
        ).interpolatePath(paths[0].path, paths[1].path);

        progress.value = 0;

        progress.value = withDelay(
          Platform.OS === 'ios' ? 0 : 100,
          withTiming(1, timingAnimationConfig || timingAnimationDefaultConfig)
        );
      })();
    }, [paths]);

    useAnimatedReaction(
      () => ({ x: positionX.value, y: positionY.value }),
      values => {
        if (!currentPath.parsed || progress.value === 0) {
          return;
        }

        const yForX = redash.getYForX(currentPath.parsed, Math.floor(values.x));

        if (yForX !== null) {
          positionY.value = yForX;
        }

        positionX.value = values.x;
      },
      [currentPath]
    );

    useAnimatedReaction(
      () => ({ x: positionX.value, y: positionY.value }),
      values => {
        if (!currentPath.parsed || progress.value === 0) {
          return;
        }

        const yForX = redash.getYForX(currentPath.parsed, Math.floor(values.x));

        if (yForX !== null) {
          positionY.value = yForX;
        }

        positionX.value = values.x;
      },
      [currentPath]
    );

    useAnimatedReaction(
      () => ({ x: positionX.value, y: positionY.value }),
      values => {
        const index = least(currentPath.points.length, i => {
          if (typeof i === 'undefined') {
            return 0;
          }

          return Math.hypot(currentPath.points[i].x - Math.floor(values.x));
        });

        console.log('Reaction');

        setOriginData(currentPath, index);
      },
      [currentPath]
    );

    const animatedProps = useAnimatedProps(() => {
      const props: PathProps & ViewProps = {};

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
        onStart: event => {
          // WARNING: the following code does not run on using iOS, but it does on Android.
          // I use the same code from onActive
          state.value = event.state;
          isActive.value = true;
          pathOpacity.value = withTiming(
            0,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          );

          if (hapticsEnabled) {
            impactHeavy();
          }
        },
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
          positionX.value = positionXWithMargin(event.x, hitSlop, width);
          positionY.value = event.y;
        },
        onFail: event => {
          state.value = event.state;
          isActive.value = false;
          pathOpacity.value = withTiming(
            1,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          );
        },
        onCancel: event => {
          state.value = event.state;
          isActive.value = false;
          pathOpacity.value = withTiming(
            1,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          );
        },
        onEnd: event => {
          state.value = event.state;
          isActive.value = false;
          pathOpacity.value = withTiming(
            1,
            timingFeedbackConfig || timingFeedbackDefaultConfig
          );

          if (hapticsEnabled) {
            impactHeavy();
          }
        },
      },
      [width, height, hapticsEnabled, hitSlop, timingFeedbackConfig]
    );

    const pathAnimatedStyles = useAnimatedStyle(() => {
      return {
        opacity: pathOpacity.value * (1 - selectedOpacity) + selectedOpacity,
      };
    }, []);

    return (
      <View style={{ width, height }}>
        <LongPressGestureHandler
          {...{ onGestureEvent }}
          enabled={gestureEnabled}
          maxDist={100000}
          minDurationMs={0}
          shouldCancelWhenOutside={false}
          {...longPressGestureHandlerProps}
        >
          <Animated.View>
            <Svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ width, height: height + 20 }}
            >
              <AnimatedPath
                // @ts-expect-error
                style={pathAnimatedStyles}
                animatedProps={animatedProps}
                stroke={stroke}
                strokeWidth={strokeWidth}
                {...props}
              />
            </Svg>
          </Animated.View>
        </LongPressGestureHandler>
      </View>
    );
  }
);
