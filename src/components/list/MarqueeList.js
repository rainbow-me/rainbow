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
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Clock, decay, Value } from 'react-native-reanimated';
import { useMemoOne } from 'use-memo-one';
import { measureTopMoverCoinRow, TopMoverCoinRow } from '../coin-row';

const {
  set,
  cond,
  eq,
  add,
  modulo,
  startClock,
  stopClock,
  clockRunning,
  sub,
  event,
  or,
} = Animated;

const DECCELERATION = 0.998;

function runDecay(clock, value, velocity) {
  const state = {
    finished: new Value(0),
    position: value,
    time: new Value(0),
    velocity: velocity,
  };

  const config = { deceleration: DECCELERATION };

  return [
    cond(clockRunning(clock), 0, [set(state.time, 0), startClock(clock)]),
    decay(clock, state, config),
    state.position,
  ];
}

export const useReanimatedValue = initialValue => {
  const value = useRef();

  if (!value.current) {
    value.current = new Value(initialValue);
  }

  return value.current;
};

const SwipeableList = ({ components, speed }) => {
  const dragX = useReanimatedValue(0);
  const state = useReanimatedValue(-1);
  const lpstate = useReanimatedValue(-1);
  const dragVX = useReanimatedValue(0);

  const onGestureEvent = useMemoOne(
    () =>
      event([
        {
          nativeEvent: { state, translationX: dragX, velocityX: dragVX },
        },
      ]),
    [dragVX, dragVX, state]
  );

  const onLPGestureEvent = useMemo(
    () =>
      event([
        {
          nativeEvent: { state: lpstate },
        },
      ]),
    [lpstate]
  );

  const transX = useReanimatedValue(0);
  const prevDragX = useReanimatedValue(0);

  const clock = useMemoOne(() => new Clock(), []);

  const transXWrapped = useMemo(
    () =>
      cond(
        or(eq(state, State.ACTIVE), eq(lpstate, 2)),
        [
          stopClock(clock),
          cond(
            eq(state, State.ACTIVE),
            [
              set(transX, add(transX, sub(dragX, prevDragX))),
              set(prevDragX, dragX),
            ],
            [set(dragVX, 0)]
          ),

          transX,
        ],
        [
          set(prevDragX, 0),
          set(transX, runDecay(clock, transX, dragVX)),
          set(transX, add(transX, speed)),
        ]
      ),
    [clock, dragVX, dragX, lpstate, prevDragX, speed, state, transX]
  );

  const sumWidth = useMemoOne(
    () => components.reduce((acc, { width }) => acc + width, 0),
    [components]
  );

  const panRef = useRef();
  const lpRef = useRef();
  const tapRef = useRef();

  return (
    <LongPressGestureHandler
      maxDist={100000}
      maxPointers={1}
      ref={lpRef}
      simultaneousHandlers={[panRef, tapRef]}
    >
      <Animated.View>
        <TapGestureHandler
          onGestureEvent={onLPGestureEvent}
          onHandlerStateChange={onLPGestureEvent}
          ref={tapRef}
          simultaneousHandlers={[panRef, lpRef]}
        >
          <Animated.View>
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onGestureEvent}
              ref={panRef}
              simultaneousHandlers={[lpRef, tapRef]}
            >
              <Animated.View style={{ height: 78, width: '100%' }}>
                <Animated.View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  {components.map(({ view, offset, width }) => (
                    <Animated.View
                      key={offset}
                      style={{
                        position: 'absolute',
                        transform: [
                          {
                            translateX: sub(
                              modulo(
                                add(transXWrapped, offset, width),
                                sumWidth || 0
                              ),
                              width
                            ),
                          },
                        ],
                      }}
                    >
                      {view}
                    </Animated.View>
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
    ({ item }) => <TopMoverCoinRow {...item} key={item?.address} />,
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
