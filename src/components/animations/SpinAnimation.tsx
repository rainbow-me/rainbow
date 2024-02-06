import React, { PropsWithChildren, useLayoutEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Props = PropsWithChildren<{
  duration?: number;
  style?: StyleProp<ViewStyle>;
}>;

export const SpinAnimation = ({ children, style, duration = 2000 }: Props) => {
  const progress = useSharedValue(0);

  useLayoutEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyles = useAnimatedStyle(() => {
    const rotation = Math.ceil(progress.value * 360);
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  return <Animated.View style={[style, animatedStyles]}>{children}</Animated.View>;
};
