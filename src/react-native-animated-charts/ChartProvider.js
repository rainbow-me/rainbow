import React, { useEffect, useMemo, useState } from 'react';
import { Text, TurboModuleRegistry, View } from 'react-native';
import {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '../utils';
import ChartContext from './ChartContext';
import { svgBezierPath } from './smoothSVG';
import useReactiveSharedValue from './useReactiveSharedValue';

const parse = data => {
  let smallestY = data[0];
  let greatestY = data[0];
  for (const d of data) {
    if (d.y < smallestY.y) {
      smallestY = d;
    }

    if (d.y > greatestY.y) {
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
    if (data.value[i].x > position) {
      idx = i;
      break;
    }
    if (i === data.value.length - 1) {
      idx = data.value.length - 1;
    }
  }
  nativeX.value = data.value[idx].nativeX.toString();
  nativeY.value = data.value[idx].nativeY.toString();
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

function ChartProvider({ data, children, softMargin = 30 }) {
  const prevData = useSharedValue([]);
  const currData = useSharedValue([]);
  const prevSmoothing = useSharedValue(0);
  const currSmoothing = useSharedValue(0);

  const progress = useSharedValue(1);
  const dotOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);
  const nativeX = useSharedValue('');
  const nativeY = useSharedValue('');
  const pathOpacity = useSharedValue(1);
  const softMarginValue = useReactiveSharedValue(softMargin);
  const size = useSharedValue(0);
  const state = useSharedValue(0);
  const [extremes, setExtremes] = useState({});

  useEffect(() => {
    if (!data || !data.points || data.points.length === 0) {
      return;
    }
    const [parsedData, newExtremes] = parse(data.points);
    setExtremes(newExtremes);
    if (prevData.value.length !== 0) {
      prevData.value = currData.value;
      prevSmoothing.value = currSmoothing.value;
      progress.value = 0;
      currData.value = parsedData;
      currSmoothing.value = data.smoothing || 0;
      progress.value = withTiming(1);
    } else {
      prevSmoothing.value = data.smoothing || 0;
      currSmoothing.value = data.smoothing || 0;
      prevData.value = parsedData;
      currData.value = parsedData;
    }
  }, [currData, currSmoothing, data, prevData, prevSmoothing, progress]);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);

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
      for (let i = 0; i < currData.value.length; i++) {
        if (currData.value[i].x > eventX / size.value.width) {
          idx = i;
          break;
        }
        if (i === currData.value.length - 1) {
          idx = currData.value.length - 1;
        }
      }

      if (idx === 0) {
        positionY.value = currData.value[idx].y * size.value.height;
      } else {
        // prev + diff over X
        positionY.value =
          (currData.value[idx - 1].y +
            (currData.value[idx].y - currData.value[idx - 1].y) *
              ((eventX / size.value.width - currData.value[idx - 1].x) /
                (currData.value[idx].x - currData.value[idx - 1].x))) *
          size.value.height;
      }

      setNativeXYAccordingToPosition(
        nativeX,
        nativeY,
        eventX / size.value.width,
        currData
      );
      positionX.value = eventX;
    },
    onCancel: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      pathOpacity.value = withTiming(1, timingConfig);
    },
    onEnd: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      pathOpacity.value = withTiming(1, timingConfig);
      haptics.impactHeavy();
    },
    onFail: event => {
      state.value = event.state;
      nativeX.value = '';
      nativeY.value = '';
      dotOpacity.value = withSpring(0, springConfig);
      dotScale.value = withSpring(0, springConfig);
      pathOpacity.value = withTiming(1, timingConfig);
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
        currData
      );
      positionX.value = positionXWithMargin(eventX, 30, size.value.width);
      positionY.value = currData.value[idx].y * size.value.height;
      dotOpacity.value = withSpring(1, springConfig);
      dotScale.value = withSpring(1, springConfig);
      pathOpacity.value = withTiming(0, timingConfig);
      haptics.impactHeavy();
    },
  });

  const path = useDerivedValue(() => {
    let fromValue = prevData.value;
    let toValue = currData.value;
    let res;
    let smoothing;
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

      res = fromValue.map(({ x, y }, i) => {
        const { x: nX, y: nY } = toValue[i];
        const mX = (x + (nX - x) * progress.value) * size.value.width;
        const mY = (y + (nY - y) * progress.value) * size.value.height;
        return { x: mX, y: mY };
      });
    } else {
      smoothing = currSmoothing.value;
      res = toValue.map(({ x, y }) => {
        return { x: x * size.value.width, y: y * size.value.height };
      });
    }

    if (smoothing !== 0) {
      return svgBezierPath(res, smoothing);
    }

    return res
      .map(({ x, y }) => {
        return `L ${x} ${y}`;
      })
      .join(' ')
      .replace('L', 'M');
  });

  // @ts-ignore

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value + 10 }, // temporary fix for clipped chart
      { scale: dotScale.value },
    ],
  }));

  const contextValue = useMemo(
    () => ({
      data,
      dotStyle,
      extremes,
      nativeX,
      nativeY,
      onLongPressGestureEvent,
      path,
      pathOpacity,
      size,
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
      path,
      pathOpacity,
    ]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      <View>{children}</View>
    </ChartContext.Provider>
  );
}

function ChartFallback() {
  return <Text> Charts are not available without Reanimated 2</Text>;
}

export default !TurboModuleRegistry.get('NativeReanimated') &&
(!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
  ? ChartFallback
  : ChartProvider;
