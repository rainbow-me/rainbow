import React, { createContext, PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

type ScaleButtonContextProps = SharedValue<number> | null;

export const ScaleButtonContext = createContext<ScaleButtonContextProps>(null);

type Props = ViewProps &
  PropsWithChildren<{
    duration?: number;
  }>;

// I managed to implement partially overflow in scale button (up to 5px),
// but overflow is not visible beyond small boundaries. Hence, to make it reactive to touches
// I couldn't just expend boundaries, because then it intercepts touches, so I managed to
// extract animated component to external value

export const ScaleButtonZoomable = ({ children, style, duration = 160, testID }: Props) => {
  const scale = useSharedValue(1);
  const scaleTraversed = useDerivedValue(() => {
    const value = withTiming(scale.value, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    return value;
  });
  const scaleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scaleTraversed.value,
        },
      ],
    };
  });

  return (
    <ScaleButtonContext.Provider value={scale}>
      <Animated.View style={[style, scaleAnimatedStyle]} testID={testID}>
        {children}
      </Animated.View>
    </ScaleButtonContext.Provider>
  );
};
