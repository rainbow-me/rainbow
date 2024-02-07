import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useCallback, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export default ({ contentHeight }: { contentHeight: number }) => {
  const offsetButtonAnimation = useSharedValue(0);
  const justOpenedSheet = useRef(false);
  const [buttonPosition, setButtonPosition] = useState<number | undefined>();

  const onHeightChange = useCallback(
    (event: LayoutChangeEvent) => {
      if (justOpenedSheet.current) {
        offsetButtonAnimation.value = withSpring(event?.nativeEvent?.layout?.height - contentHeight, {
          damping: 10,
          mass: 0.08,
          stiffness: 100,
          overshootClamping: true,
        });
      }
    },
    [contentHeight, offsetButtonAnimation]
  );

  const buttonWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offsetButtonAnimation.value }],
  }));

  const wrapperStyle = useMemo(
    () =>
      ios && [
        buttonWrapperStyle,
        buttonPosition && {
          position: 'absolute',
          top: buttonPosition,
          width: '100%',
        },
      ],
    [buttonPosition, buttonWrapperStyle]
  );

  const onPressMore = useCallback(() => {
    justOpenedSheet.current = true;
  }, []);

  const onWrapperLayout = useCallback(
    (e: LayoutChangeEvent) => !justOpenedSheet.current && setButtonPosition(e.nativeEvent.layout.y),

    []
  );

  return {
    wrapperStyle,
    onHeightChange,
    onPressMore,
    onWrapperLayout,
  };
};
