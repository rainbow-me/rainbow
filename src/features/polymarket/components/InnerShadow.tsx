import { memo, useCallback } from 'react';
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
};

export const InnerShadow = memo(function InnerShadow({ borderRadius = 0, color, blur, dx, dy }: InnerShadowProps) {
  const shadowRect = useSharedValue(ZERO_RECT);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      shadowRect.value = rrect(rect(0, 0, width, height), borderRadius, borderRadius);
    },
    [borderRadius, shadowRect]
  );

  return (
    <Animated.View style={StyleSheet.absoluteFillObject} pointerEvents="none" onLayout={onLayout}>
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
