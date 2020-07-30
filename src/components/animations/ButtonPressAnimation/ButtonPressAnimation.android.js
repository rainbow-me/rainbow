import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function ButtonPressAnimation({
  children,
  disabled,
  onLongPress,
  onPress,
  onPressStart,
  style,
}) {
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
