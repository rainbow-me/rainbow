import { partition } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { useMemoOne } from 'use-memo-one';
import { measureTopMoverCoinRow, TopMoverCoinRow } from '../coin-row';
import { withSpeed } from '@rainbow-me/utils';

const DECCELERATION = 0.998;

export const useReanimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Value(initialValue);
  }

  return value.current;
};

const SingleElement = ({
  transX,
  offset,
  width,
  sumWidth = 0,
  children,
  index,
}) => {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          ((((transX.value + offset + width) % sumWidth) + sumWidth) %
            sumWidth) -
            width || 0,
      },
    ],
  }));
  return (
    <Animated.View
      key={`${offset}-${index}`}
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

  const sumWidth = useMemoOne(
    () => components.reduce((acc, { width }) => acc + width, 0),
    [components]
  );

  const parts = useMemo(
    () => partition(components, (_, i) => i * 2 < components.length),
    [components]
  );

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
                  {parts.map((components, index) => (
                    <SingleElement
                      index={index}
                      key={`${components[0]?.offset}-${index}`}
                      offset={components[0]?.offset}
                      sumWidth={sumWidth}
                      transX={translate}
                      width={components.reduce(
                        (acc, { width }) => acc + width,
                        0
                      )}
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
                  ))}
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
  const [itemWidths, setItemWidths] = useState(null);

  const updateItemWidths = useCallback(async () => {
    const widths = await Promise.all(items.map(measureTopMoverCoinRow));
    setItemWidths(widths);
  }, [items]);

  useEffect(() => {
    updateItemWidths();
  }, [updateItemWidths]);

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

  const offsets = useMemoOne(
    () =>
      itemWidths
        ?.reduce(([first, ...tail], width) => [width + first, first, ...tail], [
          0,
        ])
        .reverse(),
    [itemWidths]
  );

  if (itemWidths === null) {
    return null;
  }

  return (
    <>
      <SwipeableList
        components={items.map((item, idx) => ({
          key: `item-${idx}`,
          offset: offsets[idx],
          view: ios
            ? renderItemCallback({ item })
            : ({ onPressCancel, onPressStart }) =>
                renderItemCallback({ item, onPressCancel, onPressStart }),
          width: itemWidths[idx],
        }))}
        speed={speed}
      />
    </>
  );
};

export default MarqueeList;
