import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import useHideSplashScreen from './helpers/hideSplashScreen';

function YetAnotherBottomSheetPortal(props) {
  return <Animated.View {...props} />;
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
    onScroll: event => {
      if (event.contentOffset.y > 150) {
        scrollTo(aref, 0, 150, false);
      }
    },
  });

  useEffect(hideSplashScreen, [hideSplashScreen]);
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'red' }]}>
      <YetAnotherBottomSheetPortal
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'blue', bottom: 30, top: 40 },
        ]}
      >
        <Animated.ScrollView
          bounces={false}
          onScroll={scrollHandler}
          ref={aref}
          scrollEventThrottle={16}
          style={{
            backgroundColor: 'white',
            width: '100%',
          }}
        >
          <Example />
        </Animated.ScrollView>
      </YetAnotherBottomSheetPortal>
    </View>
  );
}
