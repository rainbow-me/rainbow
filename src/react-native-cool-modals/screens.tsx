import React from 'react';
import { Animated } from 'react-native';
import CoolModalScreen from './specs/NativeCoolModalScreen';
import CoolModalScreenStack from './specs/NativeCoolModalScreenStack';

const AnimatedNativeScreen = Animated.createAnimatedComponent(CoolModalScreen);

type ScreenProps = React.ComponentProps<typeof CoolModalScreen>;

function Screen(props: ScreenProps, ref: React.Ref<React.ComponentRef<typeof CoolModalScreen>>) {
  return <AnimatedNativeScreen {...props} ref={ref} />;
}

export default {
  Screen: React.forwardRef(Screen),
  get ScreenStack() {
    return CoolModalScreenStack;
  },
};
