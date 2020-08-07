import React, { useEffect, useMemo, useState } from 'react';
import {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ChartContext from './ChartContext';

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
  }
  nativeX.value = data.value[idx].nativeX.toString();
  nativeY.value = data.value[idx].nativeY.toString();
}

function Chart({ data, children }) {
  const prevData = useSharedValue([]);
  const currData = useSharedValue([]);
  const progress = useSharedValue(1);
  const dotScale = useSharedValue(0);
  const nativeX = useSharedValue('');
  const nativeY = useSharedValue('');
  const size = useSharedValue(0);
  const [extremes, setExtremes] = useState({});

  useEffect(() => {
    const [parsedData, newExtremes] = parse(data);
    setExtremes(newExtremes);
    if (prevData.value.length !== 0) {
      prevData.value = currData.value;
      progress.value = 0;
      currData.value = parsedData;
      progress.value = withTiming(1);
    } else {
      prevData.value = parsedData;
      currData.value = parsedData;
    }
  }, [currData, data, prevData, progress]);
  const positionX = useSharedValue(0);
  const positionY = useSharedValue(0);

  const onPanGestureEvent = useAnimatedGestureHandler({
    onActive: event => {
      let idx = 0;
      for (let i = 0; i < currData.value.length; i++) {
        if (currData.value[i].x > event.x / size.value.width) {
          idx = i;
          break;
        }
      }

      if (idx === 0) {
        positionY.value = currData.value[idx].y * size.value.height;
      } else {
        // prev + diff over X
        positionY.value =
          (currData.value[idx - 1].y +
            (currData.value[idx].y - currData.value[idx - 1].y) *
              ((event.x / size.value.width - currData.value[idx - 1].x) /
                (currData.value[idx].x - currData.value[idx - 1].x))) *
          size.value.height;
      }

      setNativeXYAccordingToPosition(
        nativeX,
        nativeY,
        event.x / size.value.width,
        currData
      );
      positionX.value = event.x;
    },
  });

  const onTapGestureEvent = useAnimatedGestureHandler({
    onEnd: () => {
      nativeX.value = '';
      nativeY.value = '';
      dotScale.value = withSpring(0);
    },
    onStart: event => {
      progress.value = 1;
      let idx = 0;
      for (let i = 0; i < currData.value.length; i++) {
        if (currData.value[i].x > event.x / size.value.width) {
          idx = i;
          break;
        }
      }
      setNativeXYAccordingToPosition(
        nativeX,
        nativeY,
        event.x / size.value.width,
        currData
      );
      positionX.value = event.x;
      positionY.value = currData.value[idx].y * size.value.height;
      dotScale.value = withSpring(1);
    },
  });

  const path = useDerivedValue(() => {
    let fromValue = prevData.value;
    let toValue = currData.value;
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
      return fromValue
        .map(({ x, y }, i) => {
          const { x: nX, y: nY } = toValue[i];
          const mX = x + (nX - x) * progress.value;
          const mY = y + (nY - y) * progress.value;
          return `L ${mX} ${mY}`;
        })
        .join(' ')
        .replace('L', 'M');
    }

    const result = toValue
      .map(({ x, y }) => {
        return `L ${x} ${y}`;
      })
      .join(' ')
      .replace('L', 'M');

    return result;
  });

  // @ts-ignore
  const animatedStyle = useAnimatedStyle(() => {
    return {
      d: path.value,
    };
  });

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: positionX.value },
      { translateY: positionY.value },
      { scale: dotScale.value },
    ],
  }));

  const contextValue = useMemo(
    () => ({
      animatedStyle,
      data,
      dotStyle,
      extremes,
      nativeX,
      nativeY,
      onPanGestureEvent,
      onTapGestureEvent,
      size,
    }),
    [
      animatedStyle,
      dotStyle,
      onPanGestureEvent,
      onTapGestureEvent,
      nativeX,
      nativeY,
      size,
      data,
      extremes,
    ]
  );

  return (
    <ChartContext.Provider value={contextValue}>
      {children}
    </ChartContext.Provider>
  );
}

export default Chart;
