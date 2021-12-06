import React, { createElement, useCallback } from 'react';
import { ButtonPressAnimation } from '../animations';

export default function JellySelectorItem({
  enableHapticFeedback = false,
  index,
  isSelected,
  item,
  onLayout,
  onPress,
  renderItem,
  scaleTo = 0.94,
  style,
  testID,
  width,
  ...props
}) {
  const handleLayout = useCallback(e => onLayout(e, index), [index, onLayout]);
  const handlePress = useCallback(e => onPress(e, index), [index, onPress]);

  return (
    <ButtonPressAnimation
      disabled={isSelected}
      enableHapticFeedback={enableHapticFeedback}
      key={index}
      onLayout={handleLayout}
      onPress={handlePress}
      scaleTo={scaleTo}
      style={[{ width }, style]}
      testID={testID}
    >
      {createElement(renderItem, {
        isSelected,
        item,
        ...props,
      })}
    </ButtonPressAnimation>
  );
}
