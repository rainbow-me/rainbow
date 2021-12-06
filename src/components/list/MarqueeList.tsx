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
  Value,
  withDecay,
} from 'react-native-reanimated';
import { TopMoverCoinRow } from '../coin-row';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { withSpeed } from '@rainbow-me/utils';

const DECCELERATION = 0.998;

export const useReanimatedValue = (initialValue: any) => {
  const value = useRef();

  if (!value.current) {
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'Value<any>' is not assignable to type 'undef... Remove this comment to see the full error message
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
}: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

const SwipeableList = ({ components, speed, testID }: any) => {
  const transX = useSharedValue(0);
  const swiping = useSharedValue(0);
  const offset = useSharedValue(100000);
  const isPanStarted = useRef(false);
  const startPan = () => (isPanStarted.current = true);
  const endPan = () => (isPanStarted.current = false);

  useFocusEffect(() => {
    swiping.value = withSpeed({ targetSpeed: speed });
    return () => cancelAnimation(swiping);
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
  }, [speed, swiping]);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && runOnJS(startPan)();
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'start' does not exist on type '{}'.
      transX.value = ctx.start + event.translationX;
    },
    onCancel: () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && runOnJS(endPan)();
    },
    onEnd: event => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && runOnJS(endPan)();
      transX.value = withDecay({
        deceleration: DECCELERATION,
        velocity: event.velocityX,
      });
      swiping.value = withSpeed({ targetSpeed: speed });
    },
    onFail: () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && runOnJS(endPan)();
    },
    onStart: (_, ctx) => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'start' does not exist on type '{}'.
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      ios && (swiping.value = withSpeed({ targetSpeed: speed }));
    },
    onEnd: () => {
      swiping.value = withSpeed({ targetSpeed: speed });
    },
    onFail: () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      ios && (swiping.value = withSpeed({ targetSpeed: speed }));
    },
    onStart: () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      if (ios) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    },
  });

  const onLongGestureEvent = useAnimatedGestureHandler({
    onEnd: () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <LongPressGestureHandler
      maxDist={100000}
      maxPointers={1}
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'OnGestureEvent<PanGestureHandlerGestureEvent... Remove this comment to see the full error message
      onGestureEvent={onLongGestureEvent}
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'OnGestureEvent<PanGestureHandlerGestureEvent... Remove this comment to see the full error message
      onHandlerStateChange={onLongGestureEvent}
      ref={lpRef}
      simultaneousHandlers={[panRef, tapRef]}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TapGestureHandler
          // @ts-expect-error ts-migrate(2322) FIXME: Type 'OnGestureEvent<PanGestureHandlerGestureEvent... Remove this comment to see the full error message
          onGestureEvent={onTapGestureEvent}
          onHandlerStateChang={onTapGestureEvent}
          ref={tapRef}
          simultaneousHandlers={[panRef, lpRef]}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <PanGestureHandler
              activeOffsetX={[-6, 10]}
              onGestureEvent={onGestureEvent}
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              {...(android && {
                onHandlerStateChange: onHandlerStateChangeAndroid,
              })}
              ref={panRef}
              simultaneousHandlers={[lpRef, tapRef]}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Animated.View
                style={{ height: 53, width: '100%' }}
                testID={testID}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Animated.View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <SingleElement
                    onLayout={(e: any) => {
                      offset.value = e.nativeEvent.layout.width;
                    }}
                    sumWidth={offset}
                    transX={translate}
                  >
                    {components.map(({ view }: any) =>
                      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <SingleElement
                    offset={offset}
                    sumWidth={offset}
                    transX={translate}
                  >
                    {components.map(({ view }: any) =>
                      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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

const MarqueeList = ({ items = [], speed, testID }: any) => {
  const renderItemCallback = useCallback(
    ({ item, index, onPressCancel, onPressStart, testID }) => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <TopMoverCoinRow
        {...item}
        key={`topmovercoinrow-${item?.address}`}
        onPressCancel={onPressCancel}
        onPressStart={onPressStart}
        testID={`${testID}-coin-row-${index}`}
      />
    ),
    []
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwipeableList
        // @ts-expect-error ts-migrate(7006) FIXME: Parameter 'item' implicitly has an 'any' type.
        components={items.map((item, index) => ({
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
          view: ios
            ? ({ testID }: any) => renderItemCallback({ index, item, testID })
            : ({ onPressCancel, onPressStart, testID }: any) =>
                renderItemCallback({
                  index,
                  item,
                  onPressCancel,
                  onPressStart,
                  testID,
                }),
        }))}
        speed={speed}
        testID={testID}
      />
    </>
  );
};

export default MarqueeList;
