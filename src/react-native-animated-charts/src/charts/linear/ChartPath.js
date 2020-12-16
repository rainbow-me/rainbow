import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext, {
  useGenerateValues as generateValues,
} from '../../helpers/ChartContext';
import { findYExtremes } from '../../helpers/extremesHelpers';
import { svgBezierPath } from '../../smoothing/smoothSVG';

function impactHeavy() {
  'worklet';
  (Animated.runOnJS
    ? Animated.runOnJS(ReactNativeHapticFeedback.trigger)
    : ReactNativeHapticFeedback.trigger)('impactHeavy');
}

export const InternalContext = createContext(null);

const android = Platform.OS === 'android';

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

function combineConfigs(a, b) {
  'worklet';
  const r = {};
  const keysA = Object.keys(a);
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    r[key] = a[key];
  }
  const keysB = Object.keys(b);
  for (let i = 0; i < keysB.length; i++) {
    const key = keysB[i];
    r[key] = b[key];
  }
  return r;
}

const parse = data => {
  const { greatestY, smallestY } = findYExtremes(data);
  const smallestX = data[0];
  const greatestX = data[data.length - 1];
  return [
    data.map(({ x, y }) => ({
      originalX: x,
      originalY: y,
      x: (x - smallestX.x) / (greatestX.x - smallestX.x),
      y: 1 - (y - smallestY.y) / (greatestY.y - smallestY.y),
    })),
    {
      greatestX,
      greatestY,
      smallestX,
      smallestY,
    },
  ];
};

function setoriginalXYAccordingToPosition(
  originalX,
  originalY,
  position,
  data
) {
  'worklet';
  let idx = 0;
  for (let i = 0; i < data.value.length; i++) {
    if (data.value[i].x >= position) {
      idx = i;
      break;
    }
    if (i === data.value.length - 1) {
      idx = data.value.length - 1;
    }
  }
  originalX.value = data.value[idx].originalX.toString();
  originalY.value = data.value[idx].originalY
    ? data.value[idx].originalY.toString()
    : 'undefined';
}

function positionXWithMargin(x, margin, width) {
  'worklet';
  if (x < margin) {
    return Math.max(3 * x - 2 * margin, 0);
  } else if (width - x < margin) {
    return Math.min(margin + x * 2 - width, width);
  } else {
    return x;
  }
}

function getValue(data, i, smoothingStrategy) {
  'worklet';
  if (smoothingStrategy.value === 'bezier') {
    if (i === 0) {
      return data.value[i];
    }

    const p0 = data.value[i - 2] || data.value[i - 1] || data.value[i];

    const x0 = p0.x;
    const y0 = p0.y;
    const p1 = data.value[i - 1] || data.value[i];
    const x1 = p1.x;
    const y1 = p1.y;
    const p = data.value[i];
    const x = p.x;
    const y = p.y;
    const cp3x = (x0 + 4 * x1 + x) / 6;
    const cp3y = (y0 + 4 * y1 + y) / 6;
    return { x: cp3x, y: cp3y };
  }
  return data.value[i];
}

export default function ChartPathProvider({
  data: rawData,
  hitSlop = 0,
  hapticsEnabled = false,
  springConfig = {},
  timingFeedbackConfig = {},
  timingAnimationConfig = {},
  children,
  ...rest
}) {
  const valuesStore = useRef(null);
  if (valuesStore.current == null) {
    valuesStore.current = {
      currData: [],
      curroriginalData: [],
      dataQueue: [],
      prevData: [],
    };
  }

  const {
    currSmoothing,
    dotScale,
    originalX,
    originalY,
    pathOpacity,
    positionX,
    positionY,
    prevSmoothing,
    progress,
    layoutSize,
    state,
    setContextValue = () => {},
    providedData = rawData,
  } = useContext(ChartContext) || generateValues();

  const prevData = useSharedValue(valuesStore.current.prevData, 'prevData');
  const currData = useSharedValue(valuesStore.current.currData, 'currData');
  const curroriginalData = useSharedValue(
    valuesStore.current.curroriginalData,
    'curroriginalData'
  );
  const hitSlopValue = useSharedValue(hitSlop);
  const hapticsEnabledValue = useSharedValue(hapticsEnabled);
  const [extremes, setExtremes] = useState({});
  const isAnimationInProgress = useSharedValue(false, 'isAnimationInProgress');

  const [data, setData] = useState(providedData);
  const dataQueue = useSharedValue(valuesStore.current.dataQueue, 'dataQueue');
  useEffect(() => {
    if (isAnimationInProgress.value) {
      dataQueue.value.push(providedData);
    } else {
      setData(providedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedData]);

  const smoothingStrategy = useSharedValue(data.smoothingStrategy);

  useEffect(() => {
    if (!data || !data.points) {
      return;
    }
    const [parsedData] = parse(data.points);
    const [parsedoriginalData, newExtremes] = parse(
      data.nativePoints || data.points
    );
    setContextValue(prev => ({ ...prev, ...newExtremes, data }));
    setExtremes(newExtremes);
    if (prevData.value.length !== 0) {
      valuesStore.current.prevData = currData.value;
      prevData.value = currData.value;
      prevSmoothing.value = currSmoothing.value;
      progress.value = 0;
      valuesStore.current.currData = parsedData;
      currData.value = parsedData;
      valuesStore.current.curroriginalData = parsedoriginalData;
      curroriginalData.value = parsedoriginalData;
      currSmoothing.value = data.smoothingFactor || 0;
      isAnimationInProgress.value = true;
      setTimeout(
        () => {
          isAnimationInProgress.value = false;
          if (dataQueue.value.length !== 0) {
            setData(dataQueue.value[0]);
            dataQueue.value.shift();
          }
        },
        timingAnimationConfig.duration === undefined
          ? timingAnimationDefaultConfig.duration
          : timingAnimationConfig.duration
      );
      progress.value = withTiming(
        1,
        combineConfigs(timingAnimationDefaultConfig, timingAnimationConfig)
      );
    } else {
      prevSmoothing.value = data.smoothing || 0;
      currSmoothing.value = data.smoothing || 0;
      valuesStore.current.currData = parsedData;
      valuesStore.current.curroriginalData = parsedData;
      prevData.value = parsedData;
      currData.value = parsedData;
      curroriginalData.value = parsedoriginalData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const isStarted = useSharedValue(false, 'isStarted');

  const onLongPressGestureEvent = useAnimatedGestureHandler({
    onActive: event => {
      state.value = event.state;
      if (!currData.value || currData.value.length === 0) {
        return;
      }
      if (!isStarted.value) {
        dotScale.value = withSpring(
          1,
          combineConfigs(springDefaultConfig, springConfig)
        );
        pathOpacity.value = withTiming(
          0,
          combineConfigs(timingFeedbackDefaultConfig, timingFeedbackConfig)
        );
      }

      if (hapticsEnabledValue.value && !isStarted.value) {
        impactHeavy();
      }
      isStarted.value = true;

      const eventX = positionXWithMargin(
        event.x,
        hitSlopValue.value,
        layoutSize.value.width
      );

      let idx = 0;
      let ss = smoothingStrategy;
      for (let i = 0; i < currData.value.length; i++) {
        if (getValue(currData, i, ss).x > eventX / layoutSize.value.width) {
          idx = i;
          break;
        }
        if (i === currData.value.length - 1) {
          idx = currData.value.length - 1;
        }
      }

      if (
        ss.value === 'bezier' &&
        currData.value.length > 30 &&
        eventX / layoutSize.value.width >=
          currData.value[currData.value.length - 2].x
      ) {
        const prevLastY = currData.value[currData.value.length - 2].y;
        const prevLastX = currData.value[currData.value.length - 2].x;
        const lastY = currData.value[currData.value.length - 1].y;
        const lastX = currData.value[currData.value.length - 1].x;
        const progress =
          (eventX / layoutSize.value.width - prevLastX) / (lastX - prevLastX);
        positionY.value =
          (prevLastY + progress * (lastY - prevLastY)) *
          layoutSize.value.height;
      } else if (idx === 0) {
        positionY.value =
          getValue(currData, idx, ss).y * layoutSize.value.height;
      } else {
        // prev + diff over X
        positionY.value =
          (getValue(currData, idx - 1, ss).y +
            (getValue(currData, idx, ss).y -
              getValue(currData, idx - 1, ss).y) *
              ((eventX / layoutSize.value.width -
                getValue(currData, idx - 1, ss).x) /
                (getValue(currData, idx, ss).x -
                  getValue(currData, idx - 1, ss).x))) *
          layoutSize.value.height;
      }

      setoriginalXYAccordingToPosition(
        originalX,
        originalY,
        eventX / layoutSize.value.width,
        curroriginalData
      );
      positionX.value = eventX;
    },
    onCancel: event => {
      isStarted.value = false;
      state.value = event.state;
      originalX.value = '';
      originalY.value = '';
      dotScale.value = withSpring(
        0,
        combineConfigs(springDefaultConfig, springConfig)
      );
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(
          1,
          combineConfigs(timingFeedbackDefaultConfig, timingFeedbackConfig)
        );
      }
    },
    onEnd: event => {
      isStarted.value = false;
      state.value = event.state;
      originalX.value = '';
      originalY.value = '';
      dotScale.value = withSpring(
        0,
        combineConfigs(springDefaultConfig, springConfig)
      );
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(
          1,
          combineConfigs(timingFeedbackDefaultConfig, timingFeedbackConfig)
        );
      }

      if (hapticsEnabledValue.value) {
        impactHeavy();
      }
    },
    onFail: event => {
      isStarted.value = false;
      state.value = event.state;
      originalX.value = '';
      originalY.value = '';
      dotScale.value = withSpring(
        0,
        combineConfigs(springDefaultConfig, springConfig)
      );
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(
          1,
          combineConfigs(timingFeedbackDefaultConfig, timingFeedbackConfig)
        );
      }
    },
    onStart: event => {
      state.value = event.state;
      if (!currData.value || currData.value.length === 0) {
        return;
      }

      const eventX = positionXWithMargin(
        event.x,
        hitSlopValue.value,
        layoutSize.value.width
      );

      progress.value = 1;
      let idx = 0;
      for (let i = 0; i < currData.value.length; i++) {
        if (currData.value[i].x > eventX / layoutSize.value.width) {
          idx = i;
          break;
        }
        if (i === currData.value.length - 1) {
          idx = currData.value.length - 1;
        }
      }
      setoriginalXYAccordingToPosition(
        originalX,
        originalY,
        eventX / layoutSize.value.width,
        curroriginalData
      );
      dotScale.value = withSpring(
        1,
        combineConfigs(springDefaultConfig, springConfig)
      );

      if (!android) {
        positionX.value = positionXWithMargin(
          eventX,
          30,
          layoutSize.value.width
        );
        positionY.value = currData.value[idx].y * layoutSize.value.height;
        pathOpacity.value = withTiming(
          0,
          combineConfigs(timingFeedbackDefaultConfig, timingFeedbackConfig)
        );
      }
      if (hapticsEnabledValue.value && !isStarted.value) {
        impactHeavy();
      }
      isStarted.value = true;
    },
  });

  // @ts-ignore
  const dotStyle = useAnimatedStyle(
    () => ({
      opacity: dotScale.value,
      transform: [
        { translateX: positionX.value },
        { translateY: positionY.value + 10 }, // TODO temporary fix for clipped chart
        { scale: dotScale.value },
      ],
    }),
    [],
    'dotStyle'
  );

  return (
    <ChartPath
      {...{
        children,
        currData,
        currSmoothing,
        data,
        dotStyle,
        extremes,
        layoutSize,
        onLongPressGestureEvent,
        originalX,
        originalY,
        pathOpacity,
        prevData,
        prevSmoothing,
        progress,
        smoothingStrategy,
        state,
      }}
      {...rest}
    />
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({
  smoothingWhileTransitioningEnabled,
  height,
  width,
  longPressGestureHandlerProps,
  selectedStrokeWidth = 1,
  strokeWidth = 1,
  gestureEnabled = true,
  selectedOpacity = 0.7,
  style,
  onLongPressGestureEvent,
  prevData,
  currData,
  smoothingStrategy,
  prevSmoothing,
  currSmoothing,
  pathOpacity,
  progress,
  layoutSize,
  __disableRendering,
  children,
  ...props
}) {
  const smoothingWhileTransitioningEnabledValue = useSharedValue(
    smoothingWhileTransitioningEnabled
  );
  const selectedStrokeWidthValue = useSharedValue(selectedStrokeWidth);
  const strokeWidthValue = useSharedValue(strokeWidth);

  useEffect(() => {
    layoutSize.value = { height, width };
  }, [height, layoutSize, width]);

  const path = useDerivedValue(
    () => {
      let fromValue = prevData.value;
      let toValue = currData.value;
      let res;
      let smoothing = 0;
      let strategy = smoothingStrategy.value;
      if (progress.value !== 1) {
        const numOfPoints = Math.round(
          fromValue.length +
            (toValue.length - fromValue.length) *
              Math.min(progress.value, 0.5) *
              2
        );
        if (fromValue.length !== numOfPoints) {
          const mappedFrom = [];
          const coef = (fromValue.length - 1) / (numOfPoints - 1);
          for (let i = 0; i < numOfPoints; i++) {
            mappedFrom.push(fromValue[Math.round(i * coef)]);
          }
          fromValue = mappedFrom;
        }

        if (toValue.length !== numOfPoints) {
          const mappedTo = [];
          const coef = (toValue.length - 1) / (numOfPoints - 1);

          for (let i = 0; i < numOfPoints; i++) {
            mappedTo.push(toValue[Math.round(i * coef)]);
          }
          toValue = mappedTo;
        }

        if (!smoothingWhileTransitioningEnabledValue.value) {
          if (prevSmoothing.value > currSmoothing.value) {
            smoothing =
              prevSmoothing.value +
              Math.min(progress.value * 5, 1) *
                (currSmoothing.value - prevSmoothing.value);
          } else {
            smoothing =
              prevSmoothing.value +
              Math.max(Math.min((progress.value - 0.7) * 4, 1), 0) *
                (currSmoothing.value - prevSmoothing.value);
          }
        }

        res = fromValue.map(({ x, y }, i) => {
          const { x: nX, y: nY } = toValue[i];
          const mX = (x + (nX - x) * progress.value) * layoutSize.value.width;
          const mY = (y + (nY - y) * progress.value) * layoutSize.value.height;
          return { x: mX, y: mY };
        });
      } else {
        smoothing = currSmoothing.value;
        res = toValue.map(({ x, y }) => {
          return {
            x: x * layoutSize.value.width,
            y: y * layoutSize.value.height,
          };
        });
      }

      // For som reason isNaN(y) does not work
      res = res.filter(({ y }) => y === Number(y));

      if (res.length !== 0) {
        const firstValue = res[0];
        const lastValue = res[res.length - 1];
        if (firstValue.x === 0 && strategy !== 'bezier') {
          // extrapolate the first points
          res = [
            { x: res[0].x, y: res[0].y },
            { x: -res[4].x, y: res[0].y },
          ].concat(res);
        }
        if (lastValue.x === layoutSize.value.width && strategy !== 'bezier') {
          // extrapolate the last points
          res[res.length - 1].x = lastValue.x + 20;
          if (res.length > 2) {
            res[res.length - 2].x = res[res.length - 2].x + 10;
          }
        }
      }

      if (
        (smoothing !== 0 &&
          (strategy === 'complex' || strategy === 'simple')) ||
        (strategy === 'bezier' &&
          (!smoothingWhileTransitioningEnabledValue.value ||
            progress.value === 1))
      ) {
        return svgBezierPath(res, smoothing, strategy);
      }

      return res
        .map(({ x, y }) => {
          return `L ${x} ${y}`;
        })
        .join(' ')
        .replace('L', 'M');
    },
    undefined,
    'ChartPathPath'
  );

  const animatedProps = useAnimatedStyle(
    () => {
      const props = {
        d: path.value,
        strokeWidth:
          pathOpacity.value *
            (Number(strokeWidthValue.value) -
              Number(selectedStrokeWidthValue.value)) +
          Number(selectedStrokeWidthValue.value),
      };
      if (Platform.OS === 'ios') {
        props.style = {
          opacity: pathOpacity.value * (1 - selectedOpacity) + selectedOpacity,
        };
      }
      return props;
    },
    [],
    'ChartPathAnimateProps'
  );

  const animatedStyle = useAnimatedStyle(
    () => {
      return {
        opacity: pathOpacity.value * (1 - selectedOpacity) + selectedOpacity,
      };
    },
    undefined,
    'ChartPathAnimatedStyle'
  );

  return (
    <InternalContext.Provider
      value={{
        animatedProps,
        animatedStyle,
        gestureEnabled,
        height,
        longPressGestureHandlerProps,
        onLongPressGestureEvent,
        props,
        style,
        width,
      }}
    >
      {__disableRendering ? children : <SvgComponent />}
    </InternalContext.Provider>
  );
}

export function SvgComponent() {
  const {
    style,
    animatedStyle,
    height,
    width,
    animatedProps,
    props,
    onLongPressGestureEvent,
    gestureEnabled,
    longPressGestureHandlerProps,
  } = useContext(InternalContext);
  return (
    <LongPressGestureHandler
      enabled={gestureEnabled}
      maxDist={100000}
      minDurationMs={0}
      shouldCancelWhenOutside={false}
      {...longPressGestureHandlerProps}
      {...{ onGestureEvent: onLongPressGestureEvent }}
    >
      <Animated.View>
        <Svg
          height={height + 20} // temporary fix for clipped chart
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          <AnimatedPath
            animatedProps={animatedProps}
            {...props}
            style={[style, animatedStyle]}
          />
        </Svg>
      </Animated.View>
    </LongPressGestureHandler>
  );
}
