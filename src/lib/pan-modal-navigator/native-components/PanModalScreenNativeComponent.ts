import { Animated, requireNativeComponent } from 'react-native';

const PanModalScreenNativeComponent = requireNativeComponent('RNCMScreen');
const AnimatedPanModalScreenNativeComponent = Animated.createAnimatedComponent(
  PanModalScreenNativeComponent
);

export default AnimatedPanModalScreenNativeComponent;
