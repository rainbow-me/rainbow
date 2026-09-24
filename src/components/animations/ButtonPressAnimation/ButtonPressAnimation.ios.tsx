import React from 'react';

import NativeButtonNativeComponent from '@/codegen/specs/NativeButtonNativeComponent';

import { normalizeTransformOrigin } from './normalizeTransformOrigin';
import type { ButtonPressAnimationProps } from './types';

const ButtonPressAnimation = React.forwardRef<React.ComponentRef<typeof NativeButtonNativeComponent>, ButtonPressAnimationProps>(
  (
    {
      accessible = true,
      activeOpacity,
      children,
      disabled,
      duration = 160,
      enableHapticFeedback = true,
      hapticType = 'selection',
      hitSlop,
      minLongPressDuration = 500,
      onCancel,
      onLayout,
      onLongPress,
      onLongPressEnded,
      onPress,
      onPressStart,
      pressOutDuration,
      scaleTo = 0.86,
      shouldLongPressHoldPress,
      style,
      testID,
      throttle,
      transformOrigin,
      useLateHaptic = true,
    },
    ref
  ) => {
    const longPressGestureEnabled = Boolean(onLongPress || onCancel || onLongPressEnded || shouldLongPressHoldPress);

    return (
      <NativeButtonNativeComponent
        accessible={accessible}
        activeOpacity={activeOpacity}
        cancelEnabled={Boolean(onCancel)}
        disabled={disabled}
        duration={duration}
        enableHapticFeedback={enableHapticFeedback}
        hapticType={hapticType}
        hitSlop={hitSlop}
        longPressGestureEnabled={longPressGestureEnabled}
        minLongPressDuration={minLongPressDuration}
        onCancel={onCancel}
        onLayout={onLayout}
        onLongPress={onLongPress ?? undefined}
        onLongPressEnded={onLongPressEnded}
        onPress={onPress ?? undefined}
        onPressStart={onPressStart}
        pressOutDuration={pressOutDuration}
        pressStartEnabled={Boolean(onPressStart)}
        ref={ref}
        scaleTo={scaleTo}
        shouldLongPressHoldPress={shouldLongPressHoldPress}
        style={style}
        testID={testID}
        throttle={throttle}
        transformOrigin={normalizeTransformOrigin(transformOrigin)}
        useLateHaptic={useLateHaptic}
      >
        {children}
      </NativeButtonNativeComponent>
    );
  }
);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
