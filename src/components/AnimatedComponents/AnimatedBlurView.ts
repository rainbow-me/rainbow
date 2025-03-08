import { BlurView } from 'react-native-blur-view';
import Animated from 'react-native-reanimated';
import { IS_IOS } from '@/env';

export const AnimatedBlurView = IS_IOS ? Animated.createAnimatedComponent(BlurView) : Animated.View;
