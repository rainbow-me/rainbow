import { scaleLinear } from 'd3-scale';
import * as shape from 'd3-shape';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
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
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as redash from 'react-native-redash';
import Svg, { Path, PathProps } from 'react-native-svg';
import { CurveType, DataType } from '../../helpers/ChartContext';
import {
  requireOnWorklet,
  useWorkletValue,
} from '../../helpers/requireOnWorklet';
import { useChartData } from '../../helpers/useChartData';

function ascending(a, b) {
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

function least(length, compare = ascending) {
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

const springDefaultConfig = {
  damping: 15,
  mass: 1,
  stiffness: 600,
};

const timingFeedbackDefaultConfig = {
  duration: 80,
};

const timingAnimationDefaultConfig = {
  duration: 300,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

function getCurveType(curveType: CurveType) {
  switch (curveType) {
    case CurveType.basis:
      return shape.curveBasis;
    case CurveType.bump:
      return shape.curveBumpX;
    case CurveType.linear:
      return shape.curveLinear;
    case CurveType.monotone:
      return shape.curveMonotoneX;
    case CurveType.natural:
      return shape.curveNatural;
    case CurveType.step:
      return shape.curveStep;

    default:
      return shape.curveBasis;
  }
}

type CallbackType = {
  data: DataType;
  width: number;
  height: number;
};

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

interface PathData {
  path: string;
  parsed: null | redash.Path;
  points: DataType['points'];
  data: DataType['points'];
}

export const ChartPath: React.FC<ChartPathProps> = React.memo(
  ({
    hapticsEnabled,
    hitSlop = 0,
    width,
    height,
    stroke = 'black',
    selectedStrokeWidth = 4,
    strokeWidth = 2,
    selectedOpacity = 0.5,
    timingFeedbackConfig,
    timingAnimationConfig,
    longPressGestureHandlerProps = {},
    gestureEnabled = true,
    ...props
  }) => {
    const {
      data,
      positionX,
      positionY,
      originalX,
      originalY,
      state,
      isActive,
      progress,
      pathOpacity,
    } = useChartData();

    console.log('Render chart');

    const initialized = useRef(false);
    const interpolatorWorklet = useWorkletValue();

    const getScales = useCallback(({ data, width, height }: CallbackType) => {
      const x = data.points.map(item => item.x);
      const y = data.points.map(item => item.y);

      const scaleX = scaleLinear()
        .domain([Math.min(...x), Math.max(...x)])
        .range([0, width]);

      const scaleY = scaleLinear()
        .domain([Math.min(...y), Math.max(...y)])
        .range([height, 0]);

      return {
        scaleY,
        scaleX,
      };
    }, []);

    const createPath = useCallback(
      ({ data, width, height }: CallbackType): PathData => {
        const { scaleX, scaleY } = getScales({ data, width, height });

        if (!data.points.length) {
          return {
            path: '',
            parsed: null,
            points: [],
            data: [],
          };
        }

        const points: DataType['points'] = [];

        for (let i = 0; i < data.points.length; i++) {
          points.push({
            x: scaleX(data.points[i].x),
            y: scaleY(data.points[i].y),
          });
        }

        const path = shape
          .line()
          .x(item => scaleX(item.x))
          .y(item => scaleY(item.y))
          .curve(getCurveType(data.curve!))(data.points) as string;

        const parsed = redash.parse(path);

        return { path, parsed, points, data: data.points };
      },
      []
    );

    const initialPath = useMemo(() => createPath({ data, width, height }), []);

    const [paths, setPaths] = useState(() => [initialPath, initialPath]);

    useEffect(() => {
      if (initialized.current) {
        setPaths(([_, curr]) => [curr, createPath({ data, width, height })]);
      } else {
        initialized.current = true;
      }
    }, [data.points, data.curve, width, height]);

    useEffect(() => {
      if (paths[0].path === paths[1].path) {
        return;
      }

      runOnUI(() => {
        'worklet';

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
          100,
          withTiming(1, timingAnimationConfig || timingAnimationDefaultConfig)
        );
      })();
    }, [paths]);

    useAnimatedReaction(
      () => ({ x: positionX.value, y: positionY.value }),
      values => {
        const path = paths[1];

        if (!path.parsed) {
          return;
        }

        const index = least(path.points.length, i =>
          Math.hypot(path.points[i].x - Math.floor(values.x))
        );

        const yForX = redash.getYForX(path.parsed, Math.floor(values.x));

        if (yForX !== null) {
          positionY.value = yForX;
        }

        // activeIndex.value = index;
        positionX.value = values.x;
        originalX.value = path.data[index].x.toString();
        originalY.value = path.data[index].y.toString();
      },
      [paths, data]
    );

    const animatedProps = useAnimatedProps(() => {
      const props: PathProps & ViewProps = {};

      props.d = interpolatorWorklet().value
        ? interpolatorWorklet().value(progress.value)
        : paths[1].path;

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
    }, [paths]);

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

const SIZE = Dimensions.get('window').width;

const CURSOR = 16;

const styles = StyleSheet.create({
  cursorBody: {
    zIndex: 1,
    width: CURSOR,
    height: CURSOR,
    borderRadius: 7.5,
    backgroundColor: 'red',
  },
});

interface ChartDotProps {
  style?: ViewStyle;
  springConfig?: Animated.WithSpringConfig;
}

const ChartDot: React.FC<ChartDotProps> = ({ style, springConfig }) => {
  const { isActive, positionX, positionY } = useChartData();

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = positionX.value - CURSOR / 2;
    const translateY = positionY.value - CURSOR / 2;

    return {
      opacity: withSpring(
        isActive.value ? 1 : 0,
        springConfig || springDefaultConfig
      ),
      transform: [
        { translateX },
        { translateY },
        {
          scale: withSpring(
            isActive.value ? 1 : 0,
            springConfig || springDefaultConfig
          ),
        },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill]}>
      <Animated.View style={[styles.cursorBody, style, animatedStyle]} />
    </Animated.View>
  );
};
