import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  scrollTo,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import useHideSplashScreen from './helpers/hideSplashScreen';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

function YetAnotherBottomSheetPortal({
  isScrollableHeader,
  isBlockedScrolling,
  style: propStyle,
  ...props
}) {
  const translateY = useSharedValue(0);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      if (isScrollableHeader.value) {
        if (!ctx.started) {
          ctx.started = true;
          ctx.offsetY = translateY.value - event.translationY;
        }
        translateY.value = Math.max(
          Math.min(ctx.offsetY + event.translationY, 300),
          0
        );
        isBlockedScrolling.value = translateY.value > 0;
      }
    },
    onStart: (event, ctx) => {
      ctx.started = false;
      if (isScrollableHeader.value) {
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

  return (
    <PanGestureHandler
      {...{ onGestureEvent }}
      minDist={0}
      simultaneousHandlers="AnimatedScrollViewYABS"
    >
      <Animated.View {...props} style={[propStyle, style]} />
    </PanGestureHandler>
  );
}

function Example() {
  return (
    <>
      {[
        'green',
        'blue',
        'grey',
        'silver',
        'green',
        'blue',
        'grey',
        'silver',
      ].map((color, i) => (
        <View
          key={`color ${i}`}
          style={{ backgroundColor: color, height: 150, width: '100%' }}
        >
          <Text>1</Text>
          <Text>2</Text>
          <Text>3</Text>
          <Text>4</Text>
        </View>
      ))}
    </>
  );
}

export default function YetAnotherBottomSheetExample() {
  const aref = useAnimatedRef();
  const hideSplashScreen = useHideSplashScreen();
  const isScrollableHeader = useSharedValue(false);
  const isBlockedScrolling = useSharedValue(false);
  const prevPosition = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (isBlockedScrolling.value) {
        scrollTo(aref, 0, prevPosition.value, false);
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

  useEffect(hideSplashScreen, [hideSplashScreen]);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}>
      <YetAnotherBottomSheetPortal
        isBlockedScrolling={isBlockedScrolling}
        isScrollableHeader={isScrollableHeader}
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'blue',
            bottom: 30,
            height: 400,
            top: 100,
          },
        ]}
        sv={aref}
      >
        <View
          style={{ backgroundColor: 'yellow', height: 40, width: '100%' }}
        />
        <AnimatedScrollView
          bounces={false}
          contentOffset={{
            x: 0,
            y: 100,
          }}
          id="AnimatedScrollViewYABS"
          onScroll={scrollHandler}
          ref={aref}
          scrollEventThrottle={16}
          style={{
            backgroundColor: 'white',
            width: '100%',
          }}
        >
          <Example />
        </AnimatedScrollView>
      </YetAnotherBottomSheetPortal>
    </View>
  );
}
