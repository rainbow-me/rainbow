import React, { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = PropsWithChildren<{
  duration?: number;
  style?: StyleProp<ViewStyle>;
}>;

export const SpinAnimation = ({ children, style, duration = 2000 }: Props) => {
  const progress = useDerivedValue(() =>
    withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.linear,
      }),
      -1
    )
  );

  const animatedStyles = useAnimatedStyle(() => {
    const rotation = progress.value * 360;
    return { transform: [{ rotate: `${rotation}deg` }] };
  });

  return (
    <Animated.View style={[style, animatedStyles]}>{children}</Animated.View>
  );
};
