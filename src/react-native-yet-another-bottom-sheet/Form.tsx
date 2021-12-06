import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  scrollTo,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Context from './Context';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ScrollView' was resolved to '/Users/nick... Remove this comment to see the full error message
import { svid } from './ScrollView';

function useReactiveSharedValue(prop: any) {
  const sharedValue = useSharedValue(prop);
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}

export default function Form({
  style: propStyle,
  points,
  toss = 0.0001,
  panGHProps = {},
  ...props
}: any) {
  const layoutProvider = useRef({ height: 0, width: 0, x: 0, y: 0 });
  const { simultaneousHandlers, ...restPanGHProps } = panGHProps;
  const sharedPoints = useReactiveSharedValue(points);
  const sharedToss = useReactiveSharedValue(toss);
  const animatedRef = useAnimatedRef();
  const layout = useSharedValue(layoutProvider.current);
  const isScrollableHeader = useSharedValue(true);
  const isBlockedScrolling = useSharedValue(false);
  const prevPosition = useSharedValue(0);
  const translateY = useSharedValue(0);
  const hasTouchedHeader = useSharedValue(0);
  const started = useSharedValue(false);
  const offsetY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (isBlockedScrolling.value) {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'RefObject<Component<{}, {}, any>... Remove this comment to see the full error message
        scrollTo(animatedRef, 0, prevPosition.value, false);
      } else {
        prevPosition.value = event.contentOffset.y;
        isScrollableHeader.value = event.contentOffset.y <= 0;
      }
    },
  });

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: event => {
      if (
        isScrollableHeader.value ||
        hasTouchedHeader.value ||
        translateY.value > 0
      ) {
        if (!started.value) {
          started.value = true;
          offsetY.value = translateY.value - event.translationY;
        }
        translateY.value = Math.max(
          offsetY.value + event.translationY,
          sharedPoints.value[0]
        );

        isBlockedScrolling.value = translateY.value > 0;
      } else {
        started.value = false;
      }
    },
    onEnd: event => {
      const destinationPoint =
        (translateY.value > 0
          ? sharedToss.value * event.velocityY * Math.abs(event.velocityY)
          : 0) + translateY.value;
      let closest = 0;
      for (let i = 0; i < sharedPoints.value.length; i++) {
        if (
          Math.abs(sharedPoints.value[i] - destinationPoint) <
          Math.abs(sharedPoints.value[closest] - destinationPoint)
        ) {
          closest = i;
        }
      }
      cancelAnimation(translateY);
      translateY.value = withSpring(
        sharedPoints.value[closest],
        {
          damping: 80,
          overshootClamping: true,
          restDisplacementThreshold: 0.1,
          restSpeedThreshold: 0.1,
          stiffness: 200,
        },
        () => {
          isBlockedScrolling.value = sharedPoints.value[closest] > 0;
        }
      );
    },
    onStart: event => {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'number'.
      hasTouchedHeader.value =
        event.y < layout.value.y ||
        event.y > layout.value.y + layout.value.height ||
        event.x < layout.value.x ||
        event.x > layout.value.x + layout.value.width;

      started.value = false;
      if (
        isScrollableHeader.value ||
        hasTouchedHeader.value ||
        translateY.value > 0
      ) {
        started.value = true;
        offsetY.value = translateY.value;
      }
    },
  });

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const onLayout = useCallback(
    ({ nativeEvent: { layout: newLayout } }) => {
      layout.value = newLayout;
      layoutProvider.current = newLayout;
    },
    [layout]
  );

  const contextValue = useMemo(
    () => ({ animatedRef, onLayout, scrollHandler }),
    [scrollHandler, onLayout, animatedRef]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Context.Provider value={contextValue}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <PanGestureHandler
        {...{ onGestureEvent }}
        minDist={0}
        simultaneousHandlers={[
          svid,
          ...(simultaneousHandlers
            ? Array.isArray(simultaneousHandlers)
              ? simultaneousHandlers
              : [simultaneousHandlers]
            : []),
        ]}
        {...restPanGHProps}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View {...props} style={[propStyle, style]} />
      </PanGestureHandler>
    </Context.Provider>
  );
}
