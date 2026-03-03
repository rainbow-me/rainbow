import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withDecay } from 'react-native-reanimated';
import withSpeed from '@/utils/withSpeed';

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
  const swiping = useSharedValue(0);
  const offset = useSharedValue(100000);
  const panStart = useSharedValue(0);
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
      if (android) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    })
    .onStart(() => {
      panStart.value = transX.value;
      if (android) runOnJS(startPan)();
    })
    .onUpdate(event => {
      transX.value = panStart.value + event.translationX;
    })
    .onEnd(event => {
      if (android) runOnJS(endPan)();
      transX.value = withDecay({
        deceleration: DECCELERATION,
        velocity: event.velocityX,
      });
      swiping.value = withSpeed({ targetSpeed: speed });
    })
    .onFinalize((_, success) => {
      if (!success) {
        if (android) runOnJS(endPan)();
        swiping.value = withSpeed({ targetSpeed: speed });
      }
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
    .cancelsTouchesInView(false)
    .onBegin(() => {
      if (ios) {
        cancelAnimation(transX);
        cancelAnimation(swiping);
      }
    })
    .onEnd(() => {
      swiping.value = withSpeed({ targetSpeed: speed });
    })
    .onFinalize((_, success) => {
      if (!success && ios) {
        swiping.value = withSpeed({ targetSpeed: speed });
      }
    });

  const longPressGesture = Gesture.LongPress()
    .maxDistance(100000)
    .onEnd(() => {
      if (android) swiping.value = withSpeed({ targetSpeed: speed });
    });

  const translate = useDerivedValue(() => swiping.value + transX.value, []);

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture, longPressGesture);

  return (
    <GestureDetector gesture={combinedGesture}>
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
          <SingleElement offset={offset} sumWidth={offset} transX={translate}>
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
    </GestureDetector>
  );
};

const MarqueeList = ({ height, items = /** @type {any[]} */ ([]), renderItem, speed, testID }) => {
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
