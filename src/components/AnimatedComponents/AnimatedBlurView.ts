import { Platform } from 'react-native';

import { BlurView } from 'react-native-blur-view';
import Animated from 'react-native-reanimated';

export const AnimatedBlurView = Platform.OS === 'ios' ? Animated.createAnimatedComponent(BlurView) : Animated.View;
