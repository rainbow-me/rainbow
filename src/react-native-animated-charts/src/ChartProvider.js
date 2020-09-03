import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  // eslint-disable-next-line import/no-unresolved
} from 'react-native-reanimated';
import ChartContext from './ChartContext';
import useReactiveSharedValue from './useReactiveSharedValue';

function impactHeavy() {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const ReactNativeHapticFeedback = require('react-native-haptic-feedback');
  ReactNativeHapticFeedback.default.trigger('impactHeavy');
}

const android = Platform.OS === 'android';

const parse = data => {
  let smallestY = null;
  let greatestY = null;
  for (const d of data) {
    if (d.y !== undefined && (smallestY === null || d.y < smallestY.y)) {
      smallestY = d;
    }

    if (d.y !== undefined && (greatestY === null || d.y > greatestY.y)) {
      greatestY = d;
    }
  }
  const smallestX = data[0];
  const greatestX = data[data.length - 1];
  return [
    data.map(({ x, y }) => ({
      nativeX: x,
      nativeY: y,
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

function setNativeXYAccordingToPosition(nativeX, nativeY, position, data) {
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
  nativeX.value = data.value[idx].nativeX.toString();
  nativeY.value = data.value[idx].nativeY
    ? data.value[idx].nativeY.toString()
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
    const isLast = data.value.length - 1 === i;

    const p0 = isLast
      ? data.value[i - 1] || data.value[i]
      : data.value[i - 2] || data.value[i - 1] || data.value[i];

    const x0 = p0.x;
    const y0 = p0.y;
    const p1 = isLast ? data.value[i] : data.value[i - 1] || data.value[i];
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

export default function ChartProvider({
  data: rawData,
  children,
  softMargin = 30,
  enableHaptics = false,
}) {
  const prevData = useSharedValue([], 'prevData');
  const currData = useSharedValue([], 'currData');
  const currNativeData = useSharedValue([], 'currNativeData');
  const prevSmoothing = useSharedValue(0, 'prevSmoothing');
  const currSmoothing = useSharedValue(0, 'currSmoothing');

  const progress = useSharedValue(1, 'progress');
  const dotOpacity = useSharedValue(0, 'dotOpacity');
  const dotScale = useSharedValue(0, 'dotScale');
  const nativeX = useSharedValue('', 'nativeX');
  const nativeY = useSharedValue('', 'nativeY');
  const pathOpacity = useSharedValue(1, 'pathOpacity');
  const softMarginValue = useReactiveSharedValue(softMargin, 'softMarginValue');
  const enableHapticsValue = useReactiveSharedValue(
    enableHaptics,
    'enableHapticsValue'
  );
  const size = useSharedValue(0, 'size');
  const state = useSharedValue(0, 'state');
  const [extremes, setExtremes] = useState({});
  const isAnimationInProgress = useSharedValue(false, 'isAnimationInProgress');

  const [data, setData] = useState(rawData);
  const dataQueue = useSharedValue([], 'dataQueue');
  useEffect(() => {
    if (isAnimationInProgress.value) {
      dataQueue.value.push(rawData);
    } else {
      setData(rawData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const smoothingStrategy = useReactiveSharedValue(
    data.strategy,
    'smoothingStrategy'
  );

  useEffect(() => {
    if (!data || !data.points || data.points.length === 0) {
      return;
    }
    const [parsedData] = parse(data.points);
    const [parsedNativeData, newExtremes] = parse(
      data.nativePoints || data.points
    );
    setExtremes(newExtremes);
    if (prevData.value.length !== 0) {
      prevData.value = currData.value;
      prevSmoothing.value = currSmoothing.value;
      progress.value = 0;
      currData.value = parsedData;
      currNativeData.value = parsedNativeData;
      currSmoothing.value = data.smoothing || 0;
      isAnimationInProgress.value = true;
      progress.value = withTiming(1, {}, () => {
        isAnimationInProgress.value = false;
        if (dataQueue.value.length !== 0) {
          setData(dataQueue.value[0]);
          dataQueue.value.shift();
        }
      });
    } else {
      prevSmoothing.value = data.smoothing || 0;
      currSmoothing.value = data.smoothing || 0;
      prevData.value = parsedData;
      currData.value = parsedData;
      currNativeData.value = parsedNativeData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const positionX = useSharedValue(0, 'positionX');
  const positionY = useSharedValue(0, 'positionY');

  const springConfig = {
    damping: 15,
    mass: 1,
    stiffness: 600,
  };

  const timingConfig = {
    duration: 80,
  };

  const onLongPressGestureEvent = useAnimatedGestureHandler({
    onActive: event => {
      state.value = event.state;
      if (!currData.value || currData.value.length === 0) {
        return;
      }
      const eventX = positionXWithMargin(
        event.x,
        softMarginValue.value,
        size.value.width
      );

      let idx = 0;
      let ss = smoothingStrategy;
      for (let i = 0; i < currData.value.length; i++) {
        if (getValue(currData, i, ss).x > eventX / size.value.width) {
          idx = i;
          break;
        }
        if (i === currData.value.length - 1) {
          idx = currData.value.length - 1;
        }
      }

      if (idx === 0) {
        positionY.value = getValue(currData, idx, ss).y * size.value.height;
      } else {
        // prev + diff over X
        positionY.value =
          (getValue(currData, idx - 1, ss).y +
            (getValue(currData, idx, ss).y -
              getValue(currData, idx - 1, ss).y) *
              ((eventX / size.value.width - getValue(currData, idx - 1, ss).x) /
                (getValue(currData, idx, ss).x -
                  getValue(currData, idx - 1, ss).x))) *
          size.value.height;
      }

      setNativeXYAccordingToPosition(
        nativeX,
        nativeY,
        eventX / size.value.width,
        currNativeData
      );
      positionX.value = eventX;
    },
    onCancel: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, timingConfig);
      }
    },
    onEnd: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, timingConfig);
      }

      if (enableHapticsValue.value) {
        impactHeavy();
      }
    },
    onFail: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, timingConfig);
      }
    },
    onStart: event => {
      state.value = event.state;
      if (!currData.value || currData.value.length === 0) {
        return;
      }

      const eventX = positionXWithMargin(
        event.x,
        softMarginValue.value,
        size.value.width
      );

      progress.value = 1;
      let idx = 0;
      for (let i = 0; i < currData.value.length; i++) {
        if (currData.value[i].x > eventX / size.value.width) {
          idx = i;
          break;
        }
        if (i === currData.value.length - 1) {
          idx = currData.value.length - 1;
        }
      }
      setNativeXYAccordingToPosition(
        nativeX,
        nativeY,
        eventX / size.value.width,
        currNativeData
      );
      dotOpacity.value = withSpring(1, springConfig);
      dotScale.value = withSpring(1, springConfig);

      if (!android) {
        positionX.value = positionXWithMargin(eventX, 30, size.value.width);
        positionY.value = currData.value[idx].y * size.value.height;
        pathOpacity.value = withTiming(0, timingConfig);
      }
      if (enableHapticsValue.value) {
        impactHeavy();
      }
    },
  });

  // @ts-ignore
  const dotStyle = useAnimatedStyle(
    () => ({
      opacity: dotOpacity.value,
      transform: [
        { translateX: positionX.value },
        { translateY: positionY.value + 10 }, // TODO temporary fix for clipped chart
        { scale: dotScale.value },
      ],
    }),
    'dotStyle'
  );

  const contextValue = useMemo(
    () => ({
      currData,
      currSmoothing,
      data,
      dotStyle,
      extremes,
      nativeX,
      nativeY,
      onLongPressGestureEvent,
      pathOpacity,
      prevData,
      prevSmoothing,
      progress,
      size,
      smoothingStrategy,
      state,
    }),
    [
      dotStyle,
      onLongPressGestureEvent,
      nativeX,
      nativeY,
      size,
      data,
      extremes,
      state,
      pathOpacity,
      prevData,
      currData,
      prevSmoothing,
      currSmoothing,
      progress,
      smoothingStrategy,
    ]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}
