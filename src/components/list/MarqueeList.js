import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, { cancelAnimation, useAnimatedStyle, useDerivedValue, useSharedValue, withDecay } from 'react-native-reanimated';
import { withSpeed } from '@/utils';
import { runOnJS } from 'react-native-worklets';
import { IS_ANDROID, IS_IOS } from '@/env';

const DECCELERATION = 0.998;

const SAFETY_MARGIN = 100;
// beginning of the component should be within -100 and inf
const SingleElement = ({ transX, offset = { value: 0 }, sumWidth, children, onLayout }) => {
  const style = useAnimatedStyle(() => {
    const transWithinRange = (((transX.value + SAFETY_MARGIN) % sumWidth.value) - sumWidth.value) % sumWidth.value;
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
  const start = useSharedValue(0);
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

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 10])
    .onBegin(() => {
      start.value = transX.value;
    })
    .onUpdate(event => {
      IS_ANDROID && runOnJS(startPan)();
      transX.value = start.value + event.translationX;
    })
    .onEnd(event => {
      IS_ANDROID && runOnJS(endPan)();
      transX.value = withDecay({
        deceleration: DECCELERATION,
        velocity: event.velocityX,
      });
      swiping.value = withSpeed({ targetSpeed: speed });
    })
    .onFinalize(() => {
      IS_ANDROID && runOnJS(endPan)();
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

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      if (IS_IOS) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    })
    .onEnd(() => {
      swiping.value = withSpeed({ targetSpeed: speed });
    })
    .onFinalize(() => {
      IS_IOS && (swiping.value = withSpeed({ targetSpeed: speed }));
    });

  const longPressGesture = Gesture.LongPress()
    .maxDistance(100000)
    .onEnd(() => {
      IS_ANDROID && (swiping.value = withSpeed({ targetSpeed: speed }));
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture, longPressGesture);

  const translate = useDerivedValue(() => swiping.value + transX.value, []);

  return (
    <GestureDetector gesture={composedGesture}>
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
              IS_IOS
                ? view({
                    testID: null,
                  })
                : view({
                    onPressCancel: restoreAnimation,
                    onPressStart: startAnimation,
                  })
            )}
          </SingleElement>
          <SingleElement offset={offset} sumWidth={offset} transX={translate}>
            {components.map(({ view }) =>
              IS_IOS
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
    </GestureDetector>
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
