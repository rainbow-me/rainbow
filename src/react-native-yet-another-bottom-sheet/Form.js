import React, { useEffect, useMemo } from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  scrollTo,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Context from './Context';

function useReactiveSharedValue(prop) {
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
  panGHProps: { simultaneousHandlers, ...panGHProps },
  ...props
}) {
  const sharedPoints = useReactiveSharedValue(points);
  const sharedToss = useReactiveSharedValue(toss);
  const animatedRef = useAnimatedRef();
  const layout = useSharedValue({ height: 0, width: 0, x: 0, y: 0 });
  const isScrollableHeader = useSharedValue(true);
  const isBlockedScrolling = useSharedValue(false);
  const willBlockedScrolling = useSharedValue(true);
  const prevPosition = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (isBlockedScrolling.value) {
        scrollTo(animatedRef, 0, prevPosition.value, false);
      } else {
        prevPosition.value = event.contentOffset.y;
        if (event.contentOffset.y > 0) {
          isScrollableHeader.value = false;
        } else {
          isScrollableHeader.value = true;
        }
      }
    },
  });
  const translateY = useSharedValue(0);
  const hasTouchedHeader = useSharedValue(0);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (
        isScrollableHeader.value ||
        hasTouchedHeader.value ||
        translateY.value > 0
      ) {
        if (!ctx.started) {
          ctx.started = true;
          ctx.offsetY = translateY.value - event.translationY;
        }
        translateY.value = Math.max(
          ctx.offsetY + event.translationY,
          sharedPoints.value[0]
        );

        isBlockedScrolling.value = translateY.value > 0;
      } else {
        ctx.started = false;
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
      translateY.value = withSpring(sharedPoints.value[closest], {
        damping: 40,
        stiffness: 200,
        velocity: event.velocity,
      });
    },
    onStart: (event, ctx) => {
      if (!willBlockedScrolling.value) {
        isBlockedScrolling.value = true;
      }

      hasTouchedHeader.value =
        event.y < layout.value.y ||
        event.y > layout.value.y + layout.value.height ||
        event.x < layout.value.x ||
        event.x > layout.value.x + layout.value.width;

      ctx.started = false;
      if (
        isScrollableHeader.value ||
        hasTouchedHeader.value ||
        translateY.value > 0
      ) {
        // prevPosition.value = 0;
        // scrollTo(aref, 0, 0, false);
        ctx.started = true;
        ctx.offsetY = translateY.value;
      }
    },
  });

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const contextValue = useMemo(() => ({ animatedRef, layout, scrollHandler }), [
    scrollHandler,
    layout,
    animatedRef,
  ]);

  return (
    <Context.Provider value={contextValue}>
      <PanGestureHandler
        {...{ onGestureEvent }}
        minDist={0}
        simultaneousHandlers={[
          'AnimatedScrollViewYABS',
          ...(Array.isArray(simultaneousHandlers)
            ? simultaneousHandlers
            : [simultaneousHandlers]),
        ]}
        {...panGHProps}
      >
        <Animated.View {...props} style={[propStyle, style]} />
      </PanGestureHandler>
    </Context.Provider>
  );
}
