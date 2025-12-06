import { memo, useCallback, useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, Shadow, rect, rrect } from '@shopify/react-native-skia';
import Animated, { useSharedValue } from 'react-native-reanimated';

const ZERO_RECT = Object.freeze(rrect(rect(0, 0, 0, 0), 0, 0));

type InnerShadowProps = {
  borderRadius?: number;
  color: string;
  blur: number;
  dx: number;
  dy: number;
  width?: number;
  height?: number;
};

export const InnerShadow = memo(function InnerShadow({ borderRadius = 0, color, blur, dx, dy, width, height }: InnerShadowProps) {
  const hasExplicitSize = width !== undefined && height !== undefined;
  const initialRect = useMemo(
    () => (hasExplicitSize ? rrect(rect(0, 0, width, height), borderRadius, borderRadius) : ZERO_RECT),
    [hasExplicitSize, width, height, borderRadius]
  );
  const shadowRect = useSharedValue(initialRect);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      'worklet';
      const { width, height } = event.nativeEvent.layout;
      shadowRect.value = rrect(rect(0, 0, width, height), borderRadius, borderRadius);
    },
    [borderRadius, shadowRect]
  );

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={hasExplicitSize ? undefined : onLayout}>
      <Canvas style={styles.canvas}>
        <RoundedRect rect={shadowRect}>
          <Shadow dx={dx} dy={dy} blur={blur} color={color} inner shadowOnly />
        </RoundedRect>
      </Canvas>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
