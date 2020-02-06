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
      onLongPress={onLongPress}
      onPress={onPress}
      onPressStart={onPressStart}
      style={style}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  );
}
