import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  // eslint-disable-next-line import/no-unresolved
} from 'react-native-reanimated';
import ChartContext from '../../helpers/ChartContext';
import { findYExtremes } from '../../helpers/extremesHelpers';
import useReactiveSharedValue from '../../helpers/useReactiveSharedValue';

function impactHeavy() {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const ReactNativeHapticFeedback = require('react-native-haptic-feedback');
  ReactNativeHapticFeedback.default.trigger('impactHeavy');
}

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

const parse = data => {
  const { greatestY, smallestY } = findYExtremes(data);
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
  children,
  softMargin = 0,
  enableHaptics = false,
  springConfig = {},
  timingFeedbackConfig = {},
  timingAnimationConfig = {},
}) {
  const valuesStore = useRef(null);
  if (valuesStore.current == null) {
    valuesStore.current = {
      currData: [],
      currNativeData: [],
      dataQueue: [],
      prevData: [],
    };
  }

  const prevData = useSharedValue(valuesStore.current.prevData, 'prevData');
  const currData = useSharedValue(valuesStore.current.currData, 'currData');
  const currNativeData = useSharedValue(
    valuesStore.current.currNativeData,
    'currNativeData'
  );
  const prevSmoothing = useSharedValue(0, 'prevSmoothing');
  const currSmoothing = useSharedValue(0, 'currSmoothing');

  const progress = useSharedValue(1, 'progress');
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
  const dataQueue = useSharedValue(valuesStore.current.dataQueue, 'dataQueue');
  useEffect(() => {
    if (isAnimationInProgress.value) {
      dataQueue.value.push(rawData);
    } else {
      setData(rawData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData]);

  const smoothingStrategy = useReactiveSharedValue(
    data.smoothingStrategy,
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
      valuesStore.current.prevData = currData.value;
      prevData.value = currData.value;
      prevSmoothing.value = currSmoothing.value;
      progress.value = 0;
      valuesStore.current.currData = parsedData;
      currData.value = parsedData;
      valuesStore.current.currNativeData = parsedNativeData;
      currNativeData.value = parsedNativeData;
      currSmoothing.value = data.smoothingFactor || 0;
      isAnimationInProgress.value = true;
      progress.value = withTiming(
        1,
        { ...timingAnimationDefaultConfig, ...timingAnimationConfig },
        () => {
          isAnimationInProgress.value = false;
          if (dataQueue.value.length !== 0) {
            setData(dataQueue.value[0]);
            dataQueue.value.shift();
          }
        }
      );
    } else {
      prevSmoothing.value = data.smoothing || 0;
      currSmoothing.value = data.smoothing || 0;
      valuesStore.current.currData = parsedData;
      valuesStore.current.currNativeData = parsedData;
      prevData.value = parsedData;
      currData.value = parsedData;
      currNativeData.value = parsedNativeData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const positionX = useSharedValue(0, 'positionX');
  const positionY = useSharedValue(0, 'positionY');

  const isStarted = useReactiveSharedValue(false, 'isStarted');

  const onLongPressGestureEvent = useAnimatedGestureHandler({
    onActive: event => {
      state.value = event.state;
      if (!currData.value || currData.value.length === 0) {
        return;
      }
      if (!isStarted.value) {
        dotScale.value = withSpring(1, {
          ...springDefaultConfig,
          ...springConfig,
        });
        pathOpacity.value = withTiming(0, {
          ...timingFeedbackDefaultConfig,
          ...timingFeedbackConfig,
        });
      }

      if (enableHapticsValue.value && !isStarted.value) {
        impactHeavy();
      }
      isStarted.value = true;

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

      if (
        ss.value === 'bezier' &&
        currData.value.length > 30 &&
        eventX / size.value.width >= currData.value[currData.value.length - 2].x
      ) {
        const prevLastY = currData.value[currData.value.length - 2].y;
        const prevLastX = currData.value[currData.value.length - 2].x;
        const lastY = currData.value[currData.value.length - 1].y;
        const lastX = currData.value[currData.value.length - 1].x;
        const progress =
          (eventX / size.value.width - prevLastX) / (lastX - prevLastX);
        positionY.value =
          (prevLastY + progress * (lastY - prevLastY)) * size.value.height;
      } else if (idx === 0) {
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
      isStarted.value = false;
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotScale.value = withSpring(0, {
        ...springDefaultConfig,
        ...springConfig,
      });
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, {
          ...timingFeedbackDefaultConfig,
          ...timingFeedbackConfig,
        });
      }
    },
    onEnd: event => {
      isStarted.value = false;
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotScale.value = withSpring(0, {
        ...springDefaultConfig,
        ...springConfig,
      });
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, {
          ...timingFeedbackDefaultConfig,
          ...timingFeedbackConfig,
        });
      }

      if (enableHapticsValue.value) {
        impactHeavy();
      }
    },
    onFail: event => {
      isStarted.value = false;
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotScale.value = withSpring(0, {
        ...springDefaultConfig,
        ...springConfig,
      });
      if (android) {
        pathOpacity.value = 1;
      } else {
        pathOpacity.value = withTiming(1, {
          ...timingFeedbackDefaultConfig,
          ...timingFeedbackConfig,
        });
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
      dotScale.value = withSpring(1, {
        ...springDefaultConfig,
        ...springConfig,
      });

      if (!android) {
        positionX.value = positionXWithMargin(eventX, 30, size.value.width);
        positionY.value = currData.value[idx].y * size.value.height;
        pathOpacity.value = withTiming(0, {
          ...timingFeedbackDefaultConfig,
          ...timingFeedbackConfig,
        });
      }
      if (enableHapticsValue.value && !isStarted.value) {
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
    undefined,
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
