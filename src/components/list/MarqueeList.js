import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LongPressGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  Value,
  withDecay,
} from 'react-native-reanimated';
import { useMemoOne } from 'use-memo-one';
import { measureTopMoverCoinRow, TopMoverCoinRow } from '../coin-row';

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
  sumWidth,
  children,
  index,
}) => {
  const style = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX:
            ((transX.value + offset + width) % (sumWidth || 0)) - width,
        },
      ],
    };
  });
  return (
    <Animated.View
      key={`${offset}-${index}`}
      style={[
        {
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

  useEffect(() => {
    swiping.value = withDecay({ deceleration: 1, velocity: speed });
  }, [speed, swiping]);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      transX.value = ctx.start + event.translationX;
    },
    onEnd: event => {
      transX.value = withDecay({
        deceleration: DECCELERATION,
        velocity: event.velocityX - speed,
      });
      swiping.value = withDecay({ deceleration: 1, velocity: speed });
    },
    onStart: (_, ctx) => {
      ctx.start = transX.value;
    },
  });

  const onTapGestureEvent = useAnimatedGestureHandler({
    onCancel: () => {
      swiping.value = withDecay({ deceleration: 1, velocity: speed });
    },
    onEnd: () => {
      swiping.value = withDecay({ deceleration: 1, velocity: speed });
    },
    onFail: () => {
      swiping.value = withDecay({ deceleration: 1, velocity: speed });
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
          onGestureEvent={onTapGestureEvent}
          onHandlerStateChange={onTapGestureEvent}
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
                  {components.map(({ view, offset, width }, index) => (
                    <SingleElement
                      index={index}
                      key={`${offset}-${index}`}
                      offset={offset}
                      sumWidth={sumWidth}
                      transX={translate}
                      width={width}
                    >
                      {view}
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
    ({ item }) => (
      <TopMoverCoinRow {...item} key={`topmovercoinrow-${item?.address}`} />
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
          view: renderItemCallback({ item }),
          width: itemWidths[idx],
        }))}
        speed={speed}
      />
    </>
  );
};

export default MarqueeList;
