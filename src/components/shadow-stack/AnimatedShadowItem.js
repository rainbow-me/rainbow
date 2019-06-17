import Animated from 'react-native-reanimated';
import { toClass } from 'recompact';
import ShadowItem from './ShadowItem';

const AnimatedShadowItem = Animated.createAnimatedComponent(toClass(ShadowItem));

export default AnimatedShadowItem;
