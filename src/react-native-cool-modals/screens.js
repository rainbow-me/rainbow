import React from 'react';
import { Animated, requireNativeComponent } from 'react-native';

let NativeScreenValue;
let NativeScreenStack;
let AnimatedNativeScreen;

const ScreensNativeModules = {
  get NativeScreen() {
    NativeScreenValue = NativeScreenValue || requireNativeComponent('RNCMScreen', null);
    return NativeScreenValue;
  },

  get NativeScreenStack() {
    NativeScreenStack = NativeScreenStack || requireNativeComponent('RNCMScreenStack', null);
    return NativeScreenStack;
  },
};

function Screen(props, ref) {
  AnimatedNativeScreen = AnimatedNativeScreen || Animated.createAnimatedComponent(ScreensNativeModules.NativeScreen);
  return <AnimatedNativeScreen {...props} ref={ref} />;
}

export default {
  Screen: React.forwardRef(Screen),
  get ScreenStack() {
    return ScreensNativeModules.NativeScreenStack;
  },
};
