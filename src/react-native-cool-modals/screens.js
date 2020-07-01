import React from 'react';
import { Animated, requireNativeComponent } from 'react-native';

let NativeScreenValue;
let NativeScreenStack;
let AnimatedNativeScreen;

const ScreensNativeModules = {
  get NativeScreen() {
    NativeScreenValue =
      NativeScreenValue || requireNativeComponent('RNCMScreen', null);
    return NativeScreenValue;
  },

  get NativeScreenStack() {
    NativeScreenStack =
      NativeScreenStack || requireNativeComponent('RNCMScreenStack', null);
    return NativeScreenStack;
  },
};

class Screen extends React.Component {
  setRef = ref => {
    this.props.onComponentRef && this.props.onComponentRef(ref);
  };
  render() {
    AnimatedNativeScreen =
      AnimatedNativeScreen ||
      Animated.createAnimatedComponent(ScreensNativeModules.NativeScreen);

    return <AnimatedNativeScreen {...this.props} ref={this.setRef} />;
  }
}

export default {
  Screen,
  get ScreenStack() {
    return ScreensNativeModules.NativeScreenStack;
  },
};
