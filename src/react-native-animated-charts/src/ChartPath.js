import React, { useContext, useEffect } from 'react';
import { LongPressGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  // eslint-disable-next-line import/no-unresolved
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import ChartContext from './ChartContext';
import { svgBezierPath } from './smoothSVG';
import useReactiveSharedValue from './useReactiveSharedValue';
import withReanimatedFallback from './withReanimatedFallback';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function ChartPath({
  disableSmoothingWhileTransitioning,
  height,
  width,
  longPressGestureHandlerProps,
  strokeWidthSelected = 1,
  strokeWidth = 1,
  gestureEnabled = true,
  ...props
}) {
  const disableSmoothingWhileTransitioningValue = useReactiveSharedValue(
    disableSmoothingWhileTransitioning,
    'disableSmoothingWhileTransitioningValue'
  );
  const strokeWidthSelectedValue = useReactiveSharedValue(
    strokeWidthSelected,
    'strokeWidthSelectedValue'
  );
  const strokeWidthValue = useReactiveSharedValue(
    strokeWidth,
    'strokeWidthValue'
  );

  const {
    onLongPressGestureEvent,
    prevData,
    currData,
    smoothingStrategy,
    prevSmoothing,
    currSmoothing,
    pathOpacity,
    progress,
    size: layoutSize,
  } = useContext(ChartContext);

  useEffect(() => {
    layoutSize.value = { height, width };
  }, [height, layoutSize, width]);

  const path = useDerivedValue(() => {
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

      if (!disableSmoothingWhileTransitioningValue.value) {
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
      smoothing !== 0 ||
      (strategy === 'bezier' &&
        (!disableSmoothingWhileTransitioningValue.value ||
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
  }, 'ChartPathPath');

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
  }, 'ChartPathAnimatedStyle');

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
