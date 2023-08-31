import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
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
  withDecay,
} from 'react-native-reanimated';
import { withSpeed } from '@/utils';

const DECCELERATION = 0.998;

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

const SwipeableList = ({ components, height, speed, testID }) => {
  const transX = useSharedValue(0);
  const swiping = useSharedValue(0);
  const offset = useSharedValue(100000);
  const isPanStarted = useRef(false);
  const startPan = () => (isPanStarted.current = true);
  const endPan = () => (isPanStarted.current = false);

  useFocusEffect(
    useCallback(() => {
      swiping.value = withSpeed({ targetSpeed: speed });
      return () => cancelAnimation(swiping);
    }, [speed, swiping])
  );

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
      swiping.value = withSpeed({ targetSpeed: speed });
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
        swiping.value = withSpeed({ targetSpeed: speed });
      }
    }, 100);
  }, [speed, swiping]);

  const startAnimation = useCallback(() => {
    cancelAnimation(transX);
    cancelAnimation(swiping);
  }, [swiping, transX]);

  const onTapGestureEvent = useAnimatedGestureHandler({
    onCancel: () => {
      ios && (swiping.value = withSpeed({ targetSpeed: speed }));
    },
    onEnd: () => {
      swiping.value = withSpeed({ targetSpeed: speed });
    },
    onFail: () => {
      ios && (swiping.value = withSpeed({ targetSpeed: speed }));
    },
    onStart: () => {
      if (ios) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    },
  });

  const onLongGestureEvent = useAnimatedGestureHandler({
    onEnd: () => {
      android && (swiping.value = withSpeed({ targetSpeed: speed }));
    },
  });

  const panRef = useRef();
  const lpRef = useRef();
  const tapRef = useRef();
  const onHandlerStateChangeAndroid = useCallback(
    event => {
      if (event.nativeEvent.state === 3 || event.nativeEvent.state === 5) {
        swiping.value = withSpeed({ targetSpeed: speed });
      }

      if (event.nativeEvent.state === 2) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    },
    [speed, swiping, transX]
  );

  const translate = useDerivedValue(() => swiping.value + transX.value, []);

  return (
    <LongPressGestureHandler
      maxDist={100000}
      maxPointers={1}
      onGestureEvent={onLongGestureEvent}
      onHandlerStateChange={onLongGestureEvent}
      ref={lpRef}
      simultaneousHandlers={[panRef, tapRef]}
    >
      <Animated.View>
        <TapGestureHandler
          onGestureEvent={onTapGestureEvent}
          onHandlerStateChang={onTapGestureEvent}
          ref={tapRef}
          simultaneousHandlers={[panRef, lpRef]}
        >
          <Animated.View>
            <PanGestureHandler
              activeOffsetX={[-6, 10]}
              onGestureEvent={onGestureEvent}
              {...(android && {
                onHandlerStateChange: onHandlerStateChangeAndroid,
              })}
              ref={panRef}
              simultaneousHandlers={[lpRef, tapRef]}
            >
              <Animated.View style={{ height, width: '100%' }} testID={testID}>
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
                        ? view({
                            testID: null,
                          })
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
                        ? view({
                            testID: testID,
                          })
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

const MarqueeList = ({ height, items = [], renderItem, speed, testID }) => {
  return (
    <>
      <SwipeableList
        components={items.map((item, index) => ({
          view: ios
            ? () => renderItem({ index, item, testID: item.testID })
            : ({ onPressCancel, onPressStart }) =>
                renderItem({
                  index,
                  item,
                  onPressCancel,
                  onPressStart,
                  testID: item.testID,
                }),
        }))}
        height={height}
        speed={speed}
        testID={testID}
      />
    </>
  );
};

export default MarqueeList;
