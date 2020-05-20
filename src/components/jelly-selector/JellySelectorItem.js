import React, { createElement, useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';

export default function JellySelectorItem({
  index,
  isSelected,
  item,
  onLayout,
  onPress,
  renderItem,
  style,
  width,
}) {
  const handleLayout = useCallback(e => onLayout(e, index), [index, onLayout]);
  const handlePress = useCallback(e => onPress(e, index), [index, onPress]);

  return (
    <ButtonPressAnimation
      enableHapticFeedback={false}
      key={index}
      onLayout={handleLayout}
      onPress={handlePress}
      scaleTo={0.94}
      style={[{ width }, style]}
    >
      {createElement(renderItem, {
        isSelected,
        item,
      })}
    </ButtonPressAnimation>
  );
}
