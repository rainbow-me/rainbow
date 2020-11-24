import TouchableScale from '@jonny/touchable-scale';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BaseButton,
  createNativeWrapper,
  LongPressGestureHandler,
  PureNativeButton,
  State,
  TapGestureHandler,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedRawButton = createNativeWrapper(
  Animated.createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

const ScaleButton = ({
  children,
  onPress = () => {},
  activeScale = 0.9,
  springConfig = {
    damping: 10,
    mass: 1,
    stiffness: 200,
  },
  contentContainerStyle,
  handlerProps,
}) => {
  const scale = useSharedValue(1);
  const hasScaledDown = useSharedValue(0);
  const sz = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(scale.value),
        },
      ],
    };
  });

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      console.log('start');
    },
    onCancel: () => {
      console.log('cancel');
      scale.value = 1;
      hasScaledDown.value = 0;
    },
    onFail: () => {
      console.log('fail');
    },
    onEnd: () => {
      console.log('end');
      hasScaledDown.value = 0;
      scale.value = 1;
    },
    onBegin: () => {
      console.log('begin');
    },
    onActive: () => {
      console.log('active');
      if (hasScaledDown.value === 0) {
        scale.value = activeScale;
      }
      hasScaledDown.value = 1;
    },
  });

  return (
    <AnimatedRawButton onGestureEvent={gestureHandler}>
      <Animated.View style={[sz, contentContainerStyle]}>
        {children}
      </Animated.View>
    </AnimatedRawButton>
  );
};

export default function ButtonPressAnimation({
  children,
  disabled,
  elevation,
  onLongPress,
  onPress,
  onPressStart,
  style,
  opacityTouchable = false,
  wrapperProps,
  radiusAndroid: radius,
  radiusWrapperStyle,
  testID,
}) {
  if (disabled) {
    return <View style={[style, { overflow: 'visible' }]}>{children}</View>;
  }
  if (opacityTouchable) {
    return (
      <TouchableOpacity
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        style={style}
        testID={testID}
        {...wrapperProps}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <ScaleButton
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      style={style}
      testID={testID}
      {...wrapperProps}
    >
      <View pointerEvents="box-only" style={[style, { overflow: 'visible' }]}>
        {children}
      </View>
    </ScaleButton>
  );
}
