import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import type { ButtonProps, TransformOrigin } from './types';
import NativeButtonNativeComponent, { NativeButtonProps } from '@/codegen/specs/NativeButtonNativeComponent';
import styled from '@/styled-thing';
import { HapticFeedback } from '@/utils/haptics';
import { normalizeTransformOrigin } from './normalizeTransformOrigin';

const ButtonWithTransformOrigin = styled(NativeButtonNativeComponent)(({ transformOrigin }: { transformOrigin?: TransformOrigin }) => {
  if (!transformOrigin) return {};
  const [x, y] = transformOrigin;
  // 👇️ Here we want to set the button's top / left
  // properties (relative to the parent wrapper view) to
  // values opposite of the provided transformOrigin.
  // This is necessary to do in order for the `transformOrigin` prop to
  // work with NativeButton without effecting NativeButton's layout.
  const styles: ViewStyle = {};

  if (x !== 0.5) {
    styles.left = `${x + 0.5 * (x > 0.5 ? 100 : -100)}%`;
  }
  if (y !== 0.5) {
    styles.top = `${y + 0.5 * (y > 0.5 ? 100 : -100)}%`;
  }

  return styles;
});

const ButtonPressAnimation = React.forwardRef<React.ElementRef<typeof NativeButtonNativeComponent>, ButtonProps>(
  (
    {
      children,
      duration = 160,
      hapticType = HapticFeedback.selection,
      scaleTo = 0.86,
      useLateHaptic = true,
      minLongPressDuration = 500,
      enableHapticFeedback = true,
      compensateForTransformOrigin,
      transformOrigin,
      testID,
      onPress,
      ...rest
    }: ButtonProps,
    ref
  ) => {
    const normalizedTransformOrigin = useMemo(() => normalizeTransformOrigin(transformOrigin), [transformOrigin]);

    const nativeProps: NativeButtonProps = {
      ...rest,
      duration,
      enableHapticFeedback,
      hapticType,
      minLongPressDuration,
      scaleTo,
      testID,
      transformOrigin: normalizedTransformOrigin,
      useLateHaptic,
      onPress: onPress as NativeButtonProps['onPress'],
    };

    return compensateForTransformOrigin ? (
      <View>
        {/*
        👆️ This wrapper View is necessary.
        In order to compensate for the way our NativeButton's transformOrigin effects layout/positioning,
        we set the NativeButton's left / top values relative to this wrapper View.
      */}
        <ButtonWithTransformOrigin {...nativeProps} ref={ref} transformOrigin={normalizedTransformOrigin}>
          {children}
        </ButtonWithTransformOrigin>
      </View>
    ) : (
      <NativeButtonNativeComponent {...nativeProps} ref={ref}>
        {children}
      </NativeButtonNativeComponent>
    );
  }
);

ButtonPressAnimation.displayName = 'ButtonPressAnimation';

export default ButtonPressAnimation;
