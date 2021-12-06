import React from 'react';
import { Animated, requireNativeComponent } from 'react-native';

let NativeScreenValue: any;
let NativeScreenStack: any;
let AnimatedNativeScreen: any;

const ScreensNativeModules = {
  get NativeScreen() {
    NativeScreenValue =
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
      NativeScreenValue || requireNativeComponent('RNCMScreen', null);
    return NativeScreenValue;
  },

  get NativeScreenStack() {
    NativeScreenStack =
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
      NativeScreenStack || requireNativeComponent('RNCMScreenStack', null);
    return NativeScreenStack;
  },
};

function Screen(props: any, ref: any) {
  AnimatedNativeScreen =
    AnimatedNativeScreen ||
    Animated.createAnimatedComponent(ScreensNativeModules.NativeScreen);
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <AnimatedNativeScreen {...props} ref={ref} />;
}

export default {
  Screen: React.forwardRef(Screen),
  get ScreenStack() {
    return ScreensNativeModules.NativeScreenStack;
  },
};
