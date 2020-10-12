import React from 'react';
import { View } from 'react-native';
import {
  TouchableNativeFeedback,
  TouchableOpacity,
} from 'react-native-gesture-handler';
export default function ButtonPressAnimation({
  children,
  disabled,
  onLongPress,
  onPress,
  onPressStart,
  style,
  opacityTouchable = false,
}) {
  if (opacityTouchable) {
    return (
      <TouchableOpacity
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <TouchableNativeFeedback
      background={TouchableNativeFeedback.Ripple('#CCCCCC')}
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      style={style}
    >
      <View pointerEvents="box-only">{children}</View>
    </TouchableNativeFeedback>
  );
}
