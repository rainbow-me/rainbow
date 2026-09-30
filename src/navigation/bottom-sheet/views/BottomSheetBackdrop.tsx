import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useBottomSheet } from '@gorhom/bottom-sheet';
import { type BackdropPressBehavior } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { convertToRGBA, runOnJS, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

type Props = {
  animatedIndex: SharedValue<number>;
  color: string;
  opacity: number;
  pressBehavior: BackdropPressBehavior;
};

/** A sheet backdrop that releases touches on the UI thread when the sheet closes. */
export const BottomSheetBackdrop = memo(function BottomSheetBackdrop({
  animatedIndex,
  color,
  opacity,
  pressBehavior,
}: Props): React.JSX.Element {
  const { close, snapToIndex } = useBottomSheet();
  const [red, green, blue, alpha] = useMemo(() => convertToRGBA(color), [color]);

  const animatedStyle = useAnimatedStyle(() => {
    const progress = Math.max(0, Math.min(1, animatedIndex.value + 1));
    return {
      backgroundColor: `rgba(${red * 255}, ${green * 255}, ${blue * 255}, ${alpha * opacity * progress})`,
      opacity: progress === 0 ? 0 : 1,
      pointerEvents: progress === 0 ? 'none' : 'auto',
    };
  });

  const handlePress = useCallback(() => {
    if (pressBehavior === 'close') {
      close();
    } else if (pressBehavior === 'collapse') {
      snapToIndex(-1);
    } else if (typeof pressBehavior === 'number') {
      snapToIndex(pressBehavior);
    }
  }, [close, pressBehavior, snapToIndex]);

  const gesture = useMemo(() => {
    if (pressBehavior === 'none') return undefined;

    return Gesture.Tap().onEnd((_event, success) => {
      if (success) runOnJS(handlePress)();
    });
  }, [handlePress, pressBehavior]);

  const backdrop = (
    <Animated.View
      accessible={!!gesture}
      accessibilityHint={gesture ? `Tap to ${typeof pressBehavior === 'string' ? pressBehavior : 'move'} the bottom sheet` : undefined}
      accessibilityLabel={gesture ? 'Bottom sheet backdrop' : undefined}
      accessibilityRole={gesture ? 'button' : undefined}
      style={[StyleSheet.absoluteFillObject, animatedStyle]}
    />
  );

  return gesture ? <GestureDetector gesture={gesture}>{backdrop}</GestureDetector> : backdrop;
});
