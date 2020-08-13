import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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

function YetAnotherBottomSheetPortal({ style: propStyle, ...props }) {
  const translateY = useSharedValue(0);

  const onGestureEvent = useAnimatedGestureHandler({
    onActive: (event, ctx) => {
      (translateY.value = ctx.offsetY + event.translationY), 0;
    },
    onStart: (event, ctx) => {
      ctx.offsetY = translateY.value;
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
        />
      ))}
    </>
  );
}

export default function YetAnotherBottomSheetExample() {
  const aref = useAnimatedRef();
  const hideSplashScreen = useHideSplashScreen();
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: () => {
      scrollTo(aref, 0, 0, false);
    },
  });

  useEffect(hideSplashScreen, [hideSplashScreen]);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}>
      <YetAnotherBottomSheetPortal
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'blue',
            bottom: 30,
            height: 400,
            paddingTop: 40,
            top: 40,
          },
        ]}
        sv={aref}
      >
        <AnimatedScrollView
          bounces={false}
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
