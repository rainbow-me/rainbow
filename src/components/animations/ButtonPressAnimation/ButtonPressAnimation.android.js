import React from 'react';
import { TouchableOpacity } from 'react-native';

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
