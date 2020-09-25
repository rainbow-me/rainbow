import React from 'react';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';

export default function ButtonPressAnimation({
  children,
  disabled,
  onLongPress,
  onPress,
  onPressStart,
  style,
}) {
  return (
    <TouchableNativeFeedback
      disabled={disabled}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      style={style}
    >
      {children}
    </TouchableNativeFeedback>
  );
}
