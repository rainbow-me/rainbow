import React, { useCallback, useEffect, useRef } from 'react';
import {
  LongPressGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  Value,
  withDecay,
} from 'react-native-reanimated';
import { TopMoverCoinRow } from '../coin-row';
import { withSpeed } from '@rainbow-me/utils';

const DECCELERATION = 0.998;

export const useReanimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Value(initialValue);
  }

  return value.current;
};

const SAFETY_MARGIN = 100;
// beginning of the component should be within -100 and inf
const SingleElement = ({
  transX,
  offset = { value: 0 },
  sumWidth,
  children,
  onLayout,
}) => {
  const style = useAnimatedStyle(() => {
    const transWithinRange =
      (((transX.value + SAFETY_MARGIN) % sumWidth.value) - sumWidth.value) %
      sumWidth.value;
    return {
      transform: [
        {
          translateX: transWithinRange + offset.value - SAFETY_MARGIN,
        },
      ],
    };
  });
  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        {
          flexDirection: 'row',
          position: 'absolute',
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const SwipeableList = ({ components, speed }) => {
  const transX = useSharedValue(0);
  const swiping = useSharedValue(0);
  const offset = useSharedValue(100000);
  const isPanStarted = useRef(false);
  const startPan = () => (isPanStarted.current = true);
  const endPan = () => (isPanStarted.current = false);

  useEffect(() => {
    swiping.value = withSpeed({ speed });
  }, [speed, swiping]);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      android && runOnJS(startPan)();
      transX.value = ctx.start + event.translationX;
    },
    onCancel: () => {
      android && runOnJS(endPan)();
    },
    onEnd: event => {
      android && runOnJS(endPan)();
      transX.value = withDecay({
        deceleration: DECCELERATION,
        velocity: event.velocityX,
      });
      swiping.value = withSpeed({ speed });
    },
    onFail: () => {
      android && runOnJS(endPan)();
    },
    onStart: (_, ctx) => {
      ctx.start = transX.value;
    },
  });

  const restoreAnimation = useCallback(() => {
    setTimeout(() => {
      if (!isPanStarted.current) {
        swiping.value = withSpeed({ speed });
      }
    }, 100);
  }, [speed, swiping]);

  const startAnimation = useCallback(() => {
    cancelAnimation(transX);
    cancelAnimation(swiping);
  }, [swiping, transX]);

  const onTapGestureEvent = useAnimatedGestureHandler({
    onCancel: () => {
      swiping.value = withSpeed({ speed });
    },
    onEnd: () => {
      swiping.value = withSpeed({ speed });
    },
    onFail: () => {
      swiping.value = withSpeed({ speed });
    },
    onStart: () => {
      cancelAnimation(transX);
      cancelAnimation(swiping);
    },
  });

  const panRef = useRef();
  const lpRef = useRef();
  const tapRef = useRef();

  const translate = useDerivedValue(() => swiping.value + transX.value, []);

  return (
    <LongPressGestureHandler
      maxDist={100000}
      maxPointers={1}
      ref={lpRef}
      simultaneousHandlers={[panRef, tapRef]}
    >
      <Animated.View>
        <TapGestureHandler
          {...(ios
            ? {
                onGestureEvent: onTapGestureEvent,
                onHandlerStateChange: onTapGestureEvent,
              }
            : {})}
          ref={tapRef}
          simultaneousHandlers={[panRef, lpRef]}
        >
          <Animated.View>
            <PanGestureHandler
              activeOffsetX={[-6, 10]}
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onGestureEvent}
              ref={panRef}
              simultaneousHandlers={[lpRef, tapRef]}
            >
              <Animated.View style={{ height: 53, width: '100%' }}>
                <Animated.View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  <SingleElement
                    onLayout={e => {
                      offset.value = e.nativeEvent.layout.width;
                    }}
                    sumWidth={offset}
                    transX={translate}
                  >
                    {components.map(({ view }) =>
                      ios
                        ? view
                        : view({
                            onPressCancel: restoreAnimation,
                            onPressStart: startAnimation,
                          })
                    )}
                  </SingleElement>
                  <SingleElement
                    offset={offset}
                    sumWidth={offset}
                    transX={translate}
                  >
                    {components.map(({ view }) =>
                      ios
                        ? view
                        : view({
                            onPressCancel: restoreAnimation,
                            onPressStart: startAnimation,
                          })
                    )}
                  </SingleElement>
                </Animated.View>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const MarqueeList = ({ items = [], speed }) => {
  const renderItemCallback = useCallback(
    ({ item, onPressCancel, onPressStart }) => (
      <TopMoverCoinRow
        {...item}
        key={`topmovercoinrow-${item?.address}`}
        onPressCancel={onPressCancel}
        onPressStart={onPressStart}
      />
    ),
    []
  );

  return (
    <>
      <SwipeableList
        components={items.map(item => ({
          view: ios
            ? renderItemCallback({ item })
            : ({ onPressCancel, onPressStart }) =>
                renderItemCallback({ item, onPressCancel, onPressStart }),
        }))}
        speed={speed}
      />
    </>
  );
};

export default MarqueeList;
